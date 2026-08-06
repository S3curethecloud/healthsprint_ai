package com.securethecloud.healthsprint

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.os.Bundle
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.securethecloud.healthsprint.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {
    private lateinit var binding: ActivityMainBinding

    private var pendingWebPermissionRequest:
        PermissionRequest? = null

    private val cameraPermissionLauncher =
        registerForActivityResult(
            ActivityResultContracts.RequestPermission(),
        ) { granted ->
            val request = pendingWebPermissionRequest
            pendingWebPermissionRequest = null

            if (granted) {
                request?.grant(
                    arrayOf(
                        PermissionRequest.RESOURCE_VIDEO_CAPTURE,
                    ),
                )
            } else {
                request?.deny()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        configureWebView(binding.healthsprintWebView)

        binding.retryButton.setOnClickListener {
            loadHealthSprint()
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (binding.healthsprintWebView.canGoBack()) {
                        binding.healthsprintWebView.goBack()
                    } else {
                        finish()
                    }
                }
            },
        )

        if (savedInstanceState == null) {
            loadHealthSprint()
        } else {
            binding.healthsprintWebView.restoreState(
                savedInstanceState,
            )
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(webView: WebView) {
        WebView.setWebContentsDebuggingEnabled(
            BuildConfig.DEBUG,
        )

        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode =
                WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true
            setSupportMultipleWindows(false)
        }

        webView.addJavascriptInterface(
            HealthSprintBridge(webView),
            "HealthSprintNative",
        )

        webView.webViewClient =
            object : WebViewClient() {
                override fun onPageFinished(
                    view: WebView,
                    url: String,
                ) {
                    showWebView()
                }

                override fun onReceivedError(
                    view: WebView,
                    request: WebResourceRequest,
                    error: WebResourceError,
                ) {
                    if (request.isForMainFrame) {
                        showError()
                    }
                }
            }

        webView.webChromeClient =
            object : WebChromeClient() {
                override fun onPermissionRequest(
                    request: PermissionRequest,
                ) {
                    val requestsCamera =
                        request.resources.contains(
                            PermissionRequest
                                .RESOURCE_VIDEO_CAPTURE,
                        )

                    if (!requestsCamera) {
                        request.deny()
                        return
                    }

                    val permission =
                        Manifest.permission.CAMERA

                    if (
                        ContextCompat.checkSelfPermission(
                            this@MainActivity,
                            permission,
                        ) == PackageManager.PERMISSION_GRANTED
                    ) {
                        request.grant(
                            arrayOf(
                                PermissionRequest
                                    .RESOURCE_VIDEO_CAPTURE,
                            ),
                        )
                    } else {
                        pendingWebPermissionRequest?.deny()
                        pendingWebPermissionRequest = request

                        cameraPermissionLauncher.launch(
                            permission,
                        )
                    }
                }
            }
    }

    private fun loadHealthSprint() {
        showLoading()
        binding.healthsprintWebView.loadUrl(
            BuildConfig.HEALTHSPRINT_BASE_URL,
        )
    }

    private fun showLoading() {
        binding.loadingPanel.visibility =
            android.view.View.VISIBLE
        binding.errorPanel.visibility =
            android.view.View.GONE
        binding.healthsprintWebView.visibility =
            android.view.View.INVISIBLE
    }

    private fun showWebView() {
        binding.loadingPanel.visibility =
            android.view.View.GONE
        binding.errorPanel.visibility =
            android.view.View.GONE
        binding.healthsprintWebView.visibility =
            android.view.View.VISIBLE
    }

    private fun showError() {
        binding.loadingPanel.visibility =
            android.view.View.GONE
        binding.errorPanel.visibility =
            android.view.View.VISIBLE
        binding.healthsprintWebView.visibility =
            android.view.View.INVISIBLE
    }

    override fun onSaveInstanceState(
        outState: Bundle,
    ) {
        binding.healthsprintWebView.saveState(outState)
        super.onSaveInstanceState(outState)
    }

    override fun onDestroy() {
        pendingWebPermissionRequest?.deny()
        pendingWebPermissionRequest = null

        binding.healthsprintWebView.apply {
            removeJavascriptInterface(
                "HealthSprintNative",
            )
            stopLoading()
            loadUrl("about:blank")
            clearHistory()
            removeAllViews()
            destroy()
        }

        super.onDestroy()
    }
}
