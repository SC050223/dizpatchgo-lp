<?php
/**
 * DizpatchGO — Demo Request Email Handler
 * Uses PHPMailer to send webform data to sales / admin.
 */

// Define application init token to allow loading config.php
define('DIZPATCHGO_INIT', true);

// Load configuration
$config = require __DIR__ . '/config.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// Use platform-independent paths
require_once __DIR__ . '/PHPMailer-master/src/Exception.php';
require_once __DIR__ . '/PHPMailer-master/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer-master/src/SMTP.php';

// Check whether this is an AJAX / Fetch request
$isAjax = (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
       || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

function respond($success, $message, $statusCode = 200) {
    global $isAjax;
    http_response_code($statusCode);
    if ($isAjax) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => $success,
            'message' => $message
        ]);
        exit;
    } else {
        if ($success) {
            header('Location: contact.html?sent=1');
            exit;
        } else {
            echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Submission Error</title>";
            echo "<style>body{font-family:sans-serif;padding:40px;line-height:1.6;color:#333;background:#f8fafc;}";
            echo ".box{max-width:550px;margin:0 auto;background:#fff;padding:30px;border-radius:12px;border:1px solid #e2e8f0;box-shadow:0 4px 12px rgba(0,0,0,0.05);}";
            echo "h2{color:#e11d48;margin-top:0;}a{color:#0d9488;font-weight:600;text-decoration:none;}</style></head><body>";
            echo "<div class='box'><h2>Submission Error</h2><p>" . htmlspecialchars($message) . "</p>";
            echo "<p><a href='javascript:history.back()'>&larr; Go Back to Form</a></p></div></body></html>";
            exit;
        }
    }
}

// Method check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed. Please submit via the form.', 405);
}

// Anti-spam honeypot
if (!empty($_POST['hp_field'])) {
    // Return success silently for bots
    respond(true, 'Demo request received successfully.');
}

// Form fields & sanitization
$name      = trim($_POST['name'] ?? '');
$company   = trim($_POST['company'] ?? '');
$email     = trim($_POST['email'] ?? '');
$phone     = trim($_POST['phone'] ?? '');
$fleetSize = trim($_POST['fleet_size'] ?? '');
$message   = trim($_POST['message'] ?? '');

// Validation
if (empty($name) || empty($company) || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($message) < 10) {
    respond(false, 'Please complete all required fields (Name, Company, valid Work Email, and Message with at least 10 characters).', 400);
}

$mail = new PHPMailer(true);

try {
    // Server configuration from config.php
    $mail->CharSet     = 'UTF-8';
    $mail->isSMTP();
    $mail->Host        = $config['smtp']['host'];
    $mail->SMTPAuth    = $config['smtp']['auth'];
    $mail->Username    = $config['smtp']['username'];
    $mail->Password    = $config['smtp']['password'];
    $mail->Port        = (int) $config['smtp']['port'];

    // Encryption
    if (strtolower($config['smtp']['encryption']) === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } else {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    // Stream options for local/self-signed SSL certificates
    if (!empty($config['app']['allow_insecure_ssl'])) {
        $mail->SMTPOptions = [
            'ssl' => [
                'verify_peer'       => false,
                'verify_peer_name'  => false,
                'allow_self_signed' => true
            ]
        ];
    }

    // Sender & Recipient
    $mail->setFrom($config['mail']['from_email'], $config['mail']['from_name']);
    $mail->addAddress($config['mail']['recipient_email'], $config['mail']['recipient_name']);
    $mail->addReplyTo($email, $name);

    // Optional CC & BCC
    if (!empty($config['mail']['cc'])) {
        foreach ($config['mail']['cc'] as $ccEmail) {
            $mail->addCC($ccEmail);
        }
    }
    if (!empty($config['mail']['bcc'])) {
        foreach ($config['mail']['bcc'] as $bccEmail) {
            $mail->addBCC($bccEmail);
        }
    }

    // Subject
    $mail->Subject = 'New Demo Request: ' . $company . ' (' . $name . ')';

    // HTML Email Body
    $safeName      = htmlspecialchars($name);
    $safeCompany   = htmlspecialchars($company);
    $safeEmail     = htmlspecialchars($email);
    $safePhone     = htmlspecialchars($phone ?: 'Not provided');
    $safeFleetSize = htmlspecialchars($fleetSize ?: 'Not specified');
    $safeMessage   = nl2br(htmlspecialchars($message));
    $timestamp     = date('Y-m-d H:i:s T');

    $htmlContent = <<<HTML
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .header { background: #0f172a; padding: 24px 32px; color: #ffffff; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; color: #ffffff; }
        .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
        .content { padding: 32px; color: #334155; }
        .field-group { margin-bottom: 20px; }
        .label { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
        .value { font-size: 15px; color: #0f172a; font-weight: 500; }
        .message-box { background: #f1f5f9; padding: 16px; border-radius: 8px; border-left: 4px solid #0d9488; font-size: 14px; line-height: 1.6; color: #1e293b; margin-top: 8px; }
        .footer { background: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚀 New DizpatchGO Demo Request</h1>
          <p>Submitted via website contact form on {$timestamp}</p>
        </div>
        <div class="content">
          <div class="field-group">
            <div class="label">Full Name</div>
            <div class="value">{$safeName}</div>
          </div>
          <div class="field-group">
            <div class="label">Company / Organization</div>
            <div class="value">{$safeCompany}</div>
          </div>
          <div class="field-group">
            <div class="label">Work Email</div>
            <div class="value"><a href="mailto:{$safeEmail}">{$safeEmail}</a></div>
          </div>
          <div class="field-group">
            <div class="label">Phone / WhatsApp</div>
            <div class="value">{$safePhone}</div>
          </div>
          <div class="field-group">
            <div class="label">Fleet Size</div>
            <div class="value">{$safeFleetSize} Vehicles</div>
          </div>
          <div class="field-group">
            <div class="label">Project Requirements / Message</div>
            <div class="message-box">{$safeMessage}</div>
          </div>
        </div>
        <div class="footer">
          This is an automated notification from the DizpatchGO Website.
        </div>
      </div>
    </body>
    </html>
HTML;

    // Plain text fallback
    $plainText = "DizpatchGO — New Demo Request\n"
               . "====================================\n"
               . "Name:       $name\n"
               . "Company:    $company\n"
               . "Email:      $email\n"
               . "Phone:      " . ($phone ?: 'N/A') . "\n"
               . "Fleet Size: " . ($fleetSize ?: 'N/A') . "\n\n"
               . "Requirements / Message:\n"
               . "$message\n\n"
               . "====================================\n"
               . "Submitted at: $timestamp\n";

    $mail->isHTML(true);
    $mail->Body    = $htmlContent;
    $mail->AltBody = $plainText;

    if ($mail->send()) {
        respond(true, 'Your demo request has been sent successfully! Our specialist will follow up shortly.');
    } else {
        error_log('PHPMailer error: ' . $mail->ErrorInfo);
        $userMsg = !empty($config['app']['debug']) 
            ? 'Email could not be delivered: ' . $mail->ErrorInfo 
            : 'Unable to deliver message at this moment. Please reach out directly to ' . $config['mail']['recipient_email'];
        respond(false, $userMsg, 500);
    }
} catch (Exception $e) {
    error_log('PHPMailer Exception: ' . $mail->ErrorInfo);
    $userMsg = !empty($config['app']['debug']) 
        ? 'Email error: ' . $mail->ErrorInfo 
        : 'Unable to deliver message at this moment. Please reach out directly to ' . $config['mail']['recipient_email'];
    respond(false, $userMsg, 500);
}