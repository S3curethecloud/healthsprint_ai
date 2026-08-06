package com.securethecloud.healthsprint

import android.content.Context
import androidx.activity.result.contract.ActivityResultContract
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.records.TotalCaloriesBurnedRecord
import androidx.health.connect.client.records.WeightRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Duration
import java.time.Instant
import androidx.health.connect.client.records.metadata.Metadata
import androidx.health.connect.client.units.Mass

class HealthConnectManager(
    private val context: Context,
) {
    fun status(): HealthConnectStatus {
        val sdkStatus =
            HealthConnectClient.getSdkStatus(
                context,
                PROVIDER_PACKAGE_NAME,
            )

        return when (sdkStatus) {
            HealthConnectClient.SDK_AVAILABLE ->
                HealthConnectStatus.AVAILABLE

            HealthConnectClient
                .SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED ->
                HealthConnectStatus.PROVIDER_UPDATE_REQUIRED

            else -> HealthConnectStatus.UNAVAILABLE
        }
    }

    fun clientOrNull(): HealthConnectClient? =
        if (status() == HealthConnectStatus.AVAILABLE) {
            HealthConnectClient.getOrCreate(context)
        } else {
            null
        }

    suspend fun grantedPermissions(): Set<String> =
        clientOrNull()
            ?.permissionController
            ?.getGrantedPermissions()
            .orEmpty()

    suspend fun hasAllReadPermissions(): Boolean =
        grantedPermissions().containsAll(
            READ_PERMISSIONS,
        )


    suspend fun hasAllWritePermissions(): Boolean =
        grantedPermissions().containsAll(
            WRITE_PERMISSIONS,
        )

    suspend fun hasWeightWritePermission(): Boolean =
        grantedPermissions().contains(
            HealthPermission.getWritePermission(
                WeightRecord::class,
            ),
        )

    suspend fun hasExerciseWritePermission(): Boolean =
        grantedPermissions().contains(
            HealthPermission.getWritePermission(
                ExerciseSessionRecord::class,
            ),
        )

    suspend fun writeWeight(
        weightPounds: Double,
        timestamp: Instant,
        clientRecordId: String,
        clientRecordVersion: Long,
    ): HealthConnectWriteResult {
        require(weightPounds.isFinite())
        require(
            weightPounds in MIN_WEIGHT_POUNDS..
                MAX_WEIGHT_POUNDS,
        )
        require(clientRecordId.isNotBlank())
        require(
            clientRecordId.length <=
                MAX_CLIENT_RECORD_ID_LENGTH,
        )
        require(clientRecordVersion >= 1L)

        val client =
            clientOrNull()
                ?: throw HealthConnectUnavailableException()

        if (!hasWeightWritePermission()) {
            throw HealthConnectWritePermissionException()
        }

        val record =
            WeightRecord(
                time = timestamp,
                zoneOffset = null,
                weight = Mass.pounds(weightPounds),
                metadata =
                    Metadata.manualEntry(
                        clientRecordId =
                            clientRecordId,
                        clientRecordVersion =
                            clientRecordVersion,
                    ),
            )

        val response =
            client.insertRecords(
                listOf(record),
            )

        return HealthConnectWriteResult(
            clientRecordId = clientRecordId,
            clientRecordVersion =
                clientRecordVersion,
            recordId =
                response.recordIdsList
                    .firstOrNull(),
            writtenAt = timestamp,
        )
    }

    suspend fun writeExercise(
        startTime: Instant,
        endTime: Instant,
        exerciseType: Int,
        title: String,
        notes: String?,
        clientRecordId: String,
        clientRecordVersion: Long,
    ): HealthConnectWriteResult {
        require(startTime.isBefore(endTime))

        val duration =
            Duration.between(
                startTime,
                endTime,
            )

        require(
            !duration.isNegative &&
                !duration.isZero &&
                duration <= MAX_EXERCISE_DURATION,
        )

        require(
            exerciseType in SUPPORTED_EXERCISE_TYPES,
        )

        require(title.isNotBlank())
        require(
            title.length <= MAX_EXERCISE_TITLE_LENGTH,
        )

        require(
            notes == null ||
                notes.length <= MAX_EXERCISE_NOTES_LENGTH,
        )

        require(clientRecordId.isNotBlank())
        require(
            clientRecordId.length <=
                MAX_CLIENT_RECORD_ID_LENGTH,
        )

        require(clientRecordVersion >= 1L)

        val client =
            clientOrNull()
                ?: throw HealthConnectUnavailableException()

        if (!hasExerciseWritePermission()) {
            throw HealthConnectWritePermissionException()
        }

        val record =
            ExerciseSessionRecord(
                startTime = startTime,
                startZoneOffset = null,
                endTime = endTime,
                endZoneOffset = null,
                metadata =
                    Metadata.manualEntry(
                        clientRecordId =
                            clientRecordId,
                        clientRecordVersion =
                            clientRecordVersion,
                    ),
                exerciseType = exerciseType,
                title = title.trim(),
                notes =
                    notes
                        ?.trim()
                        ?.takeIf {
                            it.isNotEmpty()
                        },
            )

        val response =
            client.insertRecords(
                listOf(record),
            )

        return HealthConnectWriteResult(
            clientRecordId = clientRecordId,
            clientRecordVersion =
                clientRecordVersion,
            recordId =
                response.recordIdsList
                    .firstOrNull(),
            writtenAt = endTime,
        )
    }

    suspend fun readSummary(
        startTime: Instant,
        endTime: Instant,
    ): HealthConnectSummary {
        require(startTime.isBefore(endTime))

        val requestedDuration =
            Duration.between(startTime, endTime)

        require(
            !requestedDuration.isNegative &&
                requestedDuration <= MAX_READ_RANGE,
        )

        val client =
            clientOrNull()
                ?: throw HealthConnectUnavailableException()

        if (!hasAllReadPermissions()) {
            throw HealthConnectPermissionException()
        }

        val timeRange =
            TimeRangeFilter.between(
                startTime,
                endTime,
            )

        val aggregateResult =
            client.aggregate(
                AggregateRequest(
                    metrics = setOf(
                        StepsRecord.COUNT_TOTAL,
                        ActiveCaloriesBurnedRecord
                            .ACTIVE_CALORIES_TOTAL,
                        TotalCaloriesBurnedRecord
                            .ENERGY_TOTAL,
                    ),
                    timeRangeFilter = timeRange,
                ),
            )

        val weightResponse =
            client.readRecords(
                ReadRecordsRequest<WeightRecord>(
                    timeRangeFilter = timeRange,
                    ascendingOrder = false,
                    pageSize = 1,
                ),
            )

        val exerciseResponse =
            client.readRecords(
                ReadRecordsRequest<ExerciseSessionRecord>(
                    timeRangeFilter = timeRange,
                    ascendingOrder = true,
                ),
            )

        val exerciseDuration =
            exerciseResponse.records.fold(
                Duration.ZERO,
            ) { total, record ->
                total +
                    Duration.between(
                        record.startTime,
                        record.endTime,
                    )
            }

        return HealthConnectSummary(
            startTime = startTime,
            endTime = endTime,
            steps =
                aggregateResult[
                    StepsRecord.COUNT_TOTAL
                ] ?: 0L,
            activeCalories =
                aggregateResult[
                    ActiveCaloriesBurnedRecord
                        .ACTIVE_CALORIES_TOTAL
                ]?.inKilocalories ?: 0.0,
            totalCalories =
                aggregateResult[
                    TotalCaloriesBurnedRecord
                        .ENERGY_TOTAL
                ]?.inKilocalories ?: 0.0,
            latestWeightPounds =
                weightResponse.records
                    .firstOrNull()
                    ?.weight
                    ?.inPounds,
            latestWeightTime =
                weightResponse.records
                    .firstOrNull()
                    ?.time,
            exerciseSessionCount =
                exerciseResponse.records.size,
            exerciseDurationMinutes =
                exerciseDuration.toMinutes(),
        )
    }

    companion object {
        fun permissionContract():
            ActivityResultContract<
                Set<String>,
                Set<String>,
            > =
            PermissionController
                .createRequestPermissionResultContract(
                    PROVIDER_PACKAGE_NAME,
                )

        const val MIN_WEIGHT_POUNDS = 25.0
        const val MAX_WEIGHT_POUNDS = 1_500.0
        const val MAX_CLIENT_RECORD_ID_LENGTH = 128

        val MAX_EXERCISE_DURATION: Duration =
            Duration.ofHours(24)

        const val MAX_EXERCISE_TITLE_LENGTH = 100
        const val MAX_EXERCISE_NOTES_LENGTH = 500

        val SUPPORTED_EXERCISE_TYPES: Set<Int> =
            setOf(
                ExerciseSessionRecord
                    .EXERCISE_TYPE_OTHER_WORKOUT,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_WALKING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_RUNNING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_RUNNING_TREADMILL,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_BIKING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_BIKING_STATIONARY,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_HIKING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_STRENGTH_TRAINING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_WEIGHTLIFTING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_HIGH_INTENSITY_INTERVAL_TRAINING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_YOGA,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_PILATES,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_SWIMMING_POOL,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_SWIMMING_OPEN_WATER,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_ROWING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_ROWING_MACHINE,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_ELLIPTICAL,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_STAIR_CLIMBING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_STAIR_CLIMBING_MACHINE,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_DANCING,
                ExerciseSessionRecord
                    .EXERCISE_TYPE_STRETCHING,
            )

        val MAX_READ_RANGE: Duration =
            Duration.ofDays(45)

        const val PROVIDER_PACKAGE_NAME =
            "com.google.android.apps.healthdata"

        val READ_PERMISSIONS: Set<String> =
            setOf(
                HealthPermission.getReadPermission(
                    StepsRecord::class,
                ),
                HealthPermission.getReadPermission(
                    WeightRecord::class,
                ),
                HealthPermission.getReadPermission(
                    ExerciseSessionRecord::class,
                ),
                HealthPermission.getReadPermission(
                    ActiveCaloriesBurnedRecord::class,
                ),
                HealthPermission.getReadPermission(
                    TotalCaloriesBurnedRecord::class,
                ),
            )


        val WRITE_PERMISSIONS: Set<String> =
            setOf(
                HealthPermission.getWritePermission(
                    WeightRecord::class,
                ),
                HealthPermission.getWritePermission(
                    ExerciseSessionRecord::class,
                ),
            )
    }
}

enum class HealthConnectStatus {
    AVAILABLE,
    PROVIDER_UPDATE_REQUIRED,
    UNAVAILABLE,
}

data class HealthConnectSummary(
    val startTime: Instant,
    val endTime: Instant,
    val steps: Long,
    val activeCalories: Double,
    val totalCalories: Double,
    val latestWeightPounds: Double?,
    val latestWeightTime: Instant?,
    val exerciseSessionCount: Int,
    val exerciseDurationMinutes: Long,
)

class HealthConnectUnavailableException :
    IllegalStateException(
        "Health Connect is unavailable.",
    )

class HealthConnectPermissionException :
    SecurityException(
        "Health Connect read permission was not granted.",
    )

data class HealthConnectWriteResult(
    val clientRecordId: String,
    val clientRecordVersion: Long,
    val recordId: String?,
    val writtenAt: Instant,
)

class HealthConnectWritePermissionException :
    SecurityException(
        "Health Connect write permission was not granted.",
    )
