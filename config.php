<?php
/**
 * DizpatchGO — Mail & System Configuration
 * 
 * Instructions for deployment:
 * When uploading to production or handing over to your supervisor,
 * simply update the SMTP and recipient credentials below.
 */

// Prevent direct browser access to this configuration file
if (!defined('DIZPATCHGO_INIT')) {
    http_response_code(403);
    exit('Access denied.');
}

return [
    // -------------------------------------------------------------
    // SMTP Mail Server Settings
    // -------------------------------------------------------------
    'smtp' => [
        'host'       => 'smtp.office365.com',          // e.g., smtp.office365.com, smtp.gmail.com, or mail.presoft.com.my
        'port'       => 587,                           // 587 (STARTTLS) or 465 (SSL)
        'encryption' => 'tls',                         // 'tls' for STARTTLS (port 587) or 'ssl' (port 465)
        'auth'       => true,                          // Usually true for authenticated SMTP
        'username'   => 'damien.chin@presoft.com.my',  // Mailbox username / email
        'password'   => 'Nugget8er',                   // Password or Microsoft 365 App Password
    ],

    // -------------------------------------------------------------
    // Email Sender & Recipient Information
    // -------------------------------------------------------------
    'mail' => [
        // The "From" header (must match authenticated account in Office 365)
        'from_email'      => 'damien.chin@presoft.com.my',
        'from_name'       => 'DizpatchGO Web Form',

        // The sales/inbox destination where demo requests should be delivered
        'recipient_email' => 'damien.chin@presoft.com.my',
        'recipient_name'  => 'DizpatchGO Sales Team',

        // Optional CC or BCC (leave empty array if not needed)
        'cc'  => [],
        'bcc' => [],
    ],

    // -------------------------------------------------------------
    // Security & Environment
    // -------------------------------------------------------------
    'app' => [
        // Set to true only during local development/troubleshooting
        'debug'             => false,
        // Bypass SSL peer verification on local/self-signed setups
        'allow_insecure_ssl' => true,
    ],
];
