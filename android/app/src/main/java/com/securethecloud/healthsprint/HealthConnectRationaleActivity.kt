package com.securethecloud.healthsprint

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.securethecloud.healthsprint.databinding.ActivityHealthConnectRationaleBinding

class HealthConnectRationaleActivity : AppCompatActivity() {
    private lateinit var binding:
        ActivityHealthConnectRationaleBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding =
            ActivityHealthConnectRationaleBinding.inflate(
                layoutInflater,
            )

        setContentView(binding.root)

        binding.continueButton.setOnClickListener {
            setResult(RESULT_OK)
            finish()
        }

        binding.cancelButton.setOnClickListener {
            setResult(RESULT_CANCELED)
            finish()
        }
    }
}
