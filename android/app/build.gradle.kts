plugins {
    id("com.android.application")
}

android {
    namespace = "com.securethecloud.healthsprint"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.securethecloud.healthsprint"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"

            buildConfigField(
                "String",
                "HEALTHSPRINT_BASE_URL",
                "\"http://10.0.2.2:3000\"",
            )
        }

        release {
            isMinifyEnabled = false

            buildConfigField(
                "String",
                "HEALTHSPRINT_BASE_URL",
                "\"https://healthsprint-ai.theolagold.workers.dev\"",
            )

            proguardFiles(
                getDefaultProguardFile(
                    "proguard-android-optimize.txt",
                ),
                "proguard-rules.pro",
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlin {
        compilerOptions {
            jvmTarget.set(
                org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17,
            )
        }
    }
}

dependencies {
    implementation("androidx.health.connect:connect-client:1.1.0")
    implementation("androidx.activity:activity-ktx:1.10.1")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("androidx.core:core-ktx:1.16.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.9.2")
    implementation("androidx.webkit:webkit:1.13.0")
}
