<%@ Page Language="C#" AutoEventWireup="true" Inherits="JTESW.UI.login" CodeFile="login.aspx.cs" %>

<%@ Register Assembly="System.Web.Extensions, Version=1.0.61025.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35" Namespace="System.Web.UI" TagPrefix="asp" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="ajaxtoolkit" %>

<!DOCTYPE html>
<html>
<head runat="server">
    <title><%= SystemTitle %></title>
    <meta http-equiv="x-ua-compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <asp:PlaceHolder runat="server">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <script type="text/javascript">
            var serverRelativeURL = "<%= ServerRelativeURL %>";
            var timeoutChecking = false;
        </script>
        <script src="<%= ServerRelativeURL %>js/jquery-1.11.1.min.js" type="text/javascript"></script>
        <script src="<%= ServerRelativeURL %>js/default.js" type="text/javascript"></script>
        <script src="<%= ServerRelativeURL %>js/jquery-ui.min.js" type="text/javascript"></script>
        <script type="text/javascript">
            // Override PaintLogout and pageLoad to prevent jQuery UI positioning errors
            // on the Login page (which has no sidebar/menu elements to position)
            window.PaintLogout = function () { };
            var _origPageLoad = window.pageLoad;
            window.pageLoad = function () {
                // Only run safe parts of pageLoad on Login (skip UI widget operations)
                if (typeof InitTimerTick === 'function') { InitTimerTick(); }
            };
        </script>
    </asp:PlaceHolder>

    <style type="text/css">
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', 'Segoe UI', -apple-system, sans-serif;
            background: #0f172a;
            min-height: 100vh;
            display: flex;
            overflow: hidden;
        }

        .login-wrapper {
            position: relative;
            z-index: 1;
            width: 100%;
            min-height: 100vh;
            display: flex;
            flex-direction: row;
        }

        /* === LEFT PANEL - Branding === */
        .login-brand-panel {
            flex: 1;
            background: linear-gradient(160deg, #0a0f1e 0%, #131c35 30%, #0f172a 70%, #0a0f1e 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 40px;
            position: relative;
            overflow: hidden;
        }

        /* Grid pattern background */
        .login-brand-panel::before {
            content: '';
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-image:
                linear-gradient(rgba(59,130,246,0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(59,130,246,0.03) 1px, transparent 1px);
            background-size: 40px 40px;
            z-index: 0;
        }

        /* Glowing orbs */
        .login-brand-panel::after {
            content: '';
            position: absolute;
            top: -30%; left: -20%;
            width: 140%; height: 160%;
            background:
                radial-gradient(ellipse at 25% 30%, rgba(59,130,246,0.12) 0%, transparent 45%),
                radial-gradient(ellipse at 75% 70%, rgba(139,92,246,0.09) 0%, transparent 45%),
                radial-gradient(ellipse at 50% 50%, rgba(6,182,212,0.06) 0%, transparent 40%);
            animation: bgPulse 10s ease-in-out infinite alternate;
            z-index: 0;
        }

        @keyframes bgPulse {
            0% { transform: translate(0, 0) scale(1); opacity: 0.8; }
            100% { transform: translate(-3%, -2%) scale(1.08); opacity: 1; }
        }

        /* Floating particles */
        .particles {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            z-index: 1;
            pointer-events: none;
        }
        .particle {
            position: absolute;
            border-radius: 50%;
            animation: floatUp linear infinite;
            opacity: 0;
        }
        .particle:nth-child(1) { width: 4px; height: 4px; background: #60a5fa; left: 15%; animation-duration: 6s; animation-delay: 0s; }
        .particle:nth-child(2) { width: 3px; height: 3px; background: #a78bfa; left: 30%; animation-duration: 7s; animation-delay: 1s; }
        .particle:nth-child(3) { width: 5px; height: 5px; background: #34d399; left: 50%; animation-duration: 5s; animation-delay: 2s; }
        .particle:nth-child(4) { width: 3px; height: 3px; background: #60a5fa; left: 65%; animation-duration: 6.5s; animation-delay: 0.5s; }
        .particle:nth-child(5) { width: 4px; height: 4px; background: #818cf8; left: 80%; animation-duration: 6s; animation-delay: 1.5s; }
        .particle:nth-child(6) { width: 2px; height: 2px; background: #60a5fa; left: 25%; animation-duration: 7.5s; animation-delay: 2.5s; }
        .particle:nth-child(7) { width: 3px; height: 3px; background: #a78bfa; left: 70%; animation-duration: 5.5s; animation-delay: 3s; }
        .particle:nth-child(8) { width: 4px; height: 4px; background: #06b6d4; left: 40%; animation-duration: 6s; animation-delay: 1s; }

        @keyframes floatUp {
            0% { transform: translateY(100vh) scale(0); opacity: 0; }
            10% { opacity: 0.6; }
            90% { opacity: 0.6; }
            100% { transform: translateY(-100px) scale(1); opacity: 0; }
        }

        /* SVG Logo */
        .brand-logo-svg {
            position: relative;
            z-index: 2;
            margin-bottom: 28px;
        }

        .brand-title-text {
            position: relative;
            z-index: 2;
            text-align: center;
        }

        .brand-title-text h1 {
            font-size: 48px;
            font-weight: 800;
            color: #fff;
            letter-spacing: -1.5px;
            margin-bottom: 8px;
        }

        .brand-title-text h1 span {
            background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .brand-title-text p {
            font-size: 17px;
            color: #94a3b8;
            font-weight: 400;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 13px;
        }

        .brand-divider {
            position: relative;
            z-index: 2;
            width: 60px;
            height: 3px;
            background: linear-gradient(90deg, #60a5fa, #a78bfa);
            border-radius: 2px;
            margin: 24px auto;
        }

        .brand-tagline {
            position: relative;
            z-index: 2;
            text-align: center;
            max-width: 360px;
        }

        .brand-tagline p {
            font-size: 15px;
            color: #64748b;
            line-height: 1.8;
        }

        /* Jabil logo */
        .brand-jabil-logo {
            position: relative;
            z-index: 2;
            margin-top: 48px;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        .brand-jabil-logo:hover {
            opacity: 1;
        }
        .brand-jabil-logo img {
            height: 36px;
            filter: brightness(0) invert(1);
        }



        /* === RIGHT PANEL - Login Form === */
        .login-form-panel {
            width: 500px;
            min-width: 500px;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 60px 50px;
            position: relative;
            overflow: hidden;
        }

        /* Decorative circles on right panel */
        .login-form-panel::before {
            content: '';
            position: absolute;
            top: -80px; right: -80px;
            width: 200px; height: 200px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59,130,246,0.05) 0%, transparent 70%);
        }
        .login-form-panel::after {
            content: '';
            position: absolute;
            bottom: -60px; left: -60px;
            width: 160px; height: 160px;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(139,92,246,0.04) 0%, transparent 70%);
        }

        .login-container {
            width: 100%;
            max-width: 360px;
            position: relative;
            z-index: 1;
        }

        .login-header {
            text-align: left;
            margin-bottom: 32px;
        }

        .login-header h2 {
            font-size: 24px;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 6px;
            min-height: 30px;
        }

        .login-header h2 .word {
            display: inline-block;
            opacity: 0;
            animation: letterReveal 0.05s ease forwards;
        }

        @keyframes letterReveal {
            to {
                opacity: 1;
            }
        }

        .login-header p {
            font-size: 14px;
            color: #64748b;
            min-height: 20px;
        }

        .login-header p .letter {
            display: inline-block;
            opacity: 0;
            animation: letterReveal 0.05s ease forwards;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 8px;
            letter-spacing: 0.2px;
        }

        .input-wrapper {
            position: relative;
        }

        .input-wrapper .input-icon {
            position: absolute;
            left: 14px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 16px;
            color: #94a3b8;
            pointer-events: none;
        }

        .form-group input[type="text"],
        .form-group input[type="password"] {
            width: 100%;
            padding: 12px 16px 12px 42px;
            border: 1.5px solid #e2e8f0;
            border-radius: 10px;
            font-size: 14px;
            color: #1e293b;
            background: #f8fafc;
            transition: all 0.2s ease;
            outline: none;
            font-family: inherit;
        }

        .form-group input:focus {
            border-color: #3b82f6;
            background: #fff;
            box-shadow: 0 0 0 4px rgba(59,130,246,0.08);
        }

        .form-group input::placeholder {
            color: #94a3b8;
        }

        .login-btn {
            width: 100%;
            padding: 13px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: #fff;
            border: none;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.25s ease;
            font-family: inherit;
            margin-top: 12px;
            letter-spacing: 0.3px;
            position: relative;
            overflow: hidden;
        }

        .login-btn::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 100%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
            transition: left 0.5s ease;
        }

        .login-btn:hover::before {
            left: 100%;
        }

        .login-btn:hover {
            background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
            box-shadow: 0 8px 24px rgba(37,99,235,0.35);
            transform: translateY(-1px);
        }

        .login-btn:active {
            transform: translateY(0);
            box-shadow: 0 4px 12px rgba(37,99,235,0.25);
        }

        .error-msg {
            background: #fef2f2;
            color: #dc2626;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 13px;
            margin-bottom: 20px;
            border: 1px solid #fecaca;
            text-align: center;
            font-weight: 500;
        }

        .login-footer {
            text-align: center;
            margin-top: 36px;
            padding-top: 24px;
            border-top: 1px solid #f1f5f9;
            font-size: 12px;
            color: #94a3b8;
        }

        .login-footer a {
            color: #64748b;
            text-decoration: none;
            transition: color 0.2s;
        }

        .login-footer a:hover {
            color: #2563eb;
        }

        /* Security badge */
        .security-badge {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            margin-top: 20px;
            font-size: 11px;
            color: #94a3b8;
        }
        .security-badge svg {
            width: 14px; height: 14px;
        }

        /* Responsive */
        @media (max-width: 1024px) {
            .login-wrapper { flex-direction: column; }
            .login-brand-panel {
                padding: 40px 20px;
                min-height: 300px;
            }
            .brand-title-text h1 { font-size: 36px; }
            .login-form-panel {
                width: 100%;
                min-width: unset;
                padding: 40px 24px;
                flex: 1;
            }
        }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <!-- LEFT PANEL - Branding & Logo -->
        <div class="login-brand-panel">
            <!-- Floating particles -->
            <div class="particles">
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
                <div class="particle"></div>
            </div>

            <div class="brand-logo-svg">
                <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <!-- Outer rotating ring -->
                    <circle cx="70" cy="70" r="66" stroke="url(#logoGrad1)" stroke-width="1.5" fill="none" opacity="0.2" stroke-dasharray="6 4"/>
                    <circle cx="70" cy="70" r="60" stroke="url(#logoGrad1)" stroke-width="2" fill="none" opacity="0.3"/>
                    <!-- Hexagon frame -->
                    <path d="M70 14 L118 38 L118 102 L70 126 L22 102 L22 38 Z" stroke="url(#logoGrad2)" stroke-width="2" fill="rgba(59,130,246,0.03)"/>
                    <!-- Inner hexagon -->
                    <path d="M70 30 L104 48 L104 92 L70 110 L36 92 L36 48 Z" stroke="url(#logoGrad2)" stroke-width="1" fill="none" opacity="0.3"/>
                    <!-- Book/Library icon - main symbol -->
                    <path d="M48 50 L48 95 L70 88 L92 95 L92 50 L70 42 Z" fill="rgba(59,130,246,0.08)" stroke="url(#logoGrad2)" stroke-width="2.5" stroke-linejoin="round"/>
                    <line x1="70" y1="42" x2="70" y2="88" stroke="url(#logoGrad2)" stroke-width="2"/>
                    <!-- Page lines left -->
                    <line x1="54" y1="58" x2="65" y2="55" stroke="#60a5fa" stroke-width="1" opacity="0.5"/>
                    <line x1="54" y1="65" x2="65" y2="62" stroke="#60a5fa" stroke-width="1" opacity="0.4"/>
                    <line x1="54" y1="72" x2="65" y2="69" stroke="#60a5fa" stroke-width="1" opacity="0.3"/>
                    <!-- Page lines right -->
                    <line x1="75" y1="55" x2="86" y2="58" stroke="#a78bfa" stroke-width="1" opacity="0.5"/>
                    <line x1="75" y1="62" x2="86" y2="65" stroke="#a78bfa" stroke-width="1" opacity="0.4"/>
                    <line x1="75" y1="69" x2="86" y2="72" stroke="#a78bfa" stroke-width="1" opacity="0.3"/>
                    <!-- Circuit nodes -->
                    <circle cx="30" cy="32" r="3.5" fill="#60a5fa" opacity="0.7"/>
                    <circle cx="110" cy="32" r="3.5" fill="#a78bfa" opacity="0.7"/>
                    <circle cx="30" cy="108" r="3.5" fill="#06b6d4" opacity="0.7"/>
                    <circle cx="110" cy="108" r="3.5" fill="#a78bfa" opacity="0.7"/>
                    <circle cx="70" cy="14" r="3" fill="#60a5fa" opacity="0.5"/>
                    <circle cx="70" cy="126" r="3" fill="#818cf8" opacity="0.5"/>
                    <!-- Connection lines from nodes to hexagon -->
                    <line x1="33" y1="33" x2="48" y2="42" stroke="#60a5fa" stroke-width="1" opacity="0.3"/>
                    <line x1="107" y1="33" x2="92" y2="42" stroke="#a78bfa" stroke-width="1" opacity="0.3"/>
                    <line x1="33" y1="107" x2="48" y2="95" stroke="#06b6d4" stroke-width="1" opacity="0.3"/>
                    <line x1="107" y1="107" x2="92" y2="95" stroke="#a78bfa" stroke-width="1" opacity="0.3"/>
                    <!-- Center glow -->
                    <circle cx="70" cy="65" r="8" fill="none" stroke="#60a5fa" stroke-width="1.5" opacity="0.6"/>
                    <circle cx="70" cy="65" r="4" fill="#60a5fa" opacity="0.3"/>
                    <defs>
                        <linearGradient id="logoGrad1" x1="0" y1="0" x2="140" y2="140">
                            <stop offset="0%" stop-color="#60a5fa"/>
                            <stop offset="50%" stop-color="#818cf8"/>
                            <stop offset="100%" stop-color="#a78bfa"/>
                        </linearGradient>
                        <linearGradient id="logoGrad2" x1="20" y1="20" x2="120" y2="120">
                            <stop offset="0%" stop-color="#60a5fa"/>
                            <stop offset="100%" stop-color="#818cf8"/>
                        </linearGradient>
                    </defs>
                </svg>
            </div>

            <div class="brand-title-text">
                <h1><span>OSPL</span></h1>
                <p>One Stop Part Library</p>
            </div>

            <div class="brand-divider"></div>

            <div class="brand-tagline">
                <p>Your centralized platform for part management, verification, and tracking across all manufacturing sites.</p>
            </div>

            <!-- Jabil logo -->
            <div class="brand-jabil-logo">
                <img src="<%= ServerRelativeURL %>images/jabiIcon.png" alt="Jabil" />
            </div>


        </div>

        <!-- RIGHT PANEL - Login Form -->
        <div class="login-form-panel">
            <div class="login-container">
                <form id="form1" runat="server">
                    <asp:ScriptManager ID="ScriptManager1" runat="server"></asp:ScriptManager>

                    <div class="login-header">
                        <h2 id="welcomeText"></h2>
                        <p id="subtitleText"></p>
                    </div>

                    <asp:Label ID="lblError" runat="server" Text="Invalid Credentials" Visible="false" CssClass="error-msg"></asp:Label>
                    <div class="error-msg" id="div_lblError" runat="server" visible="false">Invalid Credentials</div>

                    <div class="form-group">
                        <label for="txtNTName">NT Login</label>
                        <div class="input-wrapper">
                            <span class="input-icon">&#128100;</span>
                            <asp:TextBox ID="txtNTName" runat="server" placeholder="Enter your NT login" />
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="txtPassword">Password</label>
                        <div class="input-wrapper">
                            <span class="input-icon">&#128272;</span>
                            <asp:TextBox ID="txtPassword" runat="server" TextMode="Password" placeholder="Enter your password" />
                        </div>
                    </div>

                    <asp:Button runat="server" ID="btnSignIn" Text="Sign In" OnClick="btnSignIn_Click" CssClass="login-btn" />

                   <%-- <div class="security-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>Secured with LDAP Authentication</span>
                    </div>--%>

                    <div class="login-footer">
                        &copy; <%= DateTime.Now.ToString("yyyy") %> Jabil. All rights reserved.<br />
                        Powered by <a href="http://jpetewebapp/" target="_blank">Penang Engineering</a>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script type="text/javascript">
        (function () {
            function typeText(el, text, className, delay) {
                for (var i = 0; i < text.length; i++) {
                    var span = document.createElement("span");
                    span.className = className;
                    span.textContent = text[i] === " " ? "\u00A0" : text[i];
                    span.style.animationDelay = (i * delay) + "s";
                    el.appendChild(span);
                }
            }
            typeText(document.getElementById("welcomeText"), "Welcome Back", "word", 0.08);
            typeText(document.getElementById("subtitleText"), "Sign in to OSPL", "letter", 0.08);
        })();
    </script>
</body>
</html>
