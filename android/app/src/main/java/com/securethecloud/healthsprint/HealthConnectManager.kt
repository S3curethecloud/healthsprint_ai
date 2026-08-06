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
