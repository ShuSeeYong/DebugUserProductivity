using System;
using System.Configuration;
using System.DirectoryServices;
using System.Web.UI;
using JTESW.DTO.Common;
using JTESW.UI.Base;
using JTESW.BLL.Base;
using AjaxControlToolkit;
using System.DirectoryServices.AccountManagement;

namespace JTESW.UI
{
    public partial class login : System.Web.UI.Page
    {
        ClientInformationDTO clientInformationDto { get; set; }
        public string ServerRelativeURL { get; set; }
        public string SystemTitle { get; set; }
        private const int maxLoginAttempt = 3;
        private const int accountLockDuration = 15;
        // add in for default login checking
        //public string callParentFunc = "";



        protected void Page_Load(object sender, EventArgs e)
        {
            ServerRelativeURL = ConfigurationManager.AppSettings["ServerRelativeURL"].ToString();
            SystemTitle = ConfigurationManager.AppSettings["SystemTitle"].ToString();


            if (!Page.IsPostBack)
            {
                ClearSession();

                if (txtNTName.Text.Length == 0)
                    txtNTName.Focus();
                else
                    txtPassword.Focus();
            }
        }

        protected void btnSignIn_Click(object sender, EventArgs e)
        {
            //default login function from 
            if (txtNTName.Text.Trim() != "")
            {
                if (IsLDAPLock(txtNTName.Text.Trim()))
                {
                    lblError.Visible = true;
                    return;
                }
                if (IsAccountLock(txtNTName.Text.Trim()))
                {
                    lblError.Visible = true;
                    return;
                }

                SoapClientBLL soapClientBLL = new SoapClientBLL(ConfigurationManager.AppSettings["WebServiceAddress"].ToString());
                if (soapClientBLL.isAuthenticate(txtNTName.Text, txtPassword.Text))
                {
                    Session["FailedLoginCount"] = null;
                    Session["LastFailedLogin"] = null;
                    Session[CachingNames.LoginStationName] = Request.UserHostAddress.ToString() == "::1" ? NetworkingIPv4.IPConvertor.GetIP4Address() : Request.UserHostAddress.ToString();
                    Session[CachingNames.LoginUserNTName] = txtNTName.Text.Trim().Substring(txtNTName.Text.Trim().IndexOf(@"\") + 1);
                    Response.Redirect("Default.aspx");
                }
                else
                {   //default login function
                    if (IsLDAPLock(txtNTName.Text.Trim()))
                    {
                        lblError.Visible = true;
                        return;
                    }
                    ValidateAccountLock();
                    lblError.Visible = true;
                }
            }
        }

        private void ValidateAccountLock()
        {
            int failedLoginCount = 0;
            if (Session["FailedLoginCount"] == null)
            {
                Session["FailedLoginCount"] = 0;
            }

            int.TryParse(Session["FailedLoginCount"].ToString(), out failedLoginCount);
            failedLoginCount++;
            Session["FailedLoginCount"] = failedLoginCount;
            Session["LastFailedLogin"] = DateTime.Now;

            if (failedLoginCount >= maxLoginAttempt)
            {
                div_lblError.InnerHtml = "<div>Access has been locked.  <br/>Please try again in " + accountLockDuration + " minutes.</div>";
            }
            else
            {
                div_lblError.InnerHtml = "<div>Invalid user name or password.  <br/>You have " + (maxLoginAttempt - failedLoginCount) + " attempt" + ((maxLoginAttempt - failedLoginCount) <= 1 ? "" : "s") + " left.</div>";
            }
        }

        private bool IsAccountLock(string username)
        {
            int failedLoginCount = 0;
            DateTime LastFailedLogin;
            if (Session["FailedLoginCount"] == null)
            {
                return false;
            }

            int.TryParse(Session["FailedLoginCount"].ToString(), out failedLoginCount);
            LastFailedLogin = Convert.ToDateTime(Session["LastFailedLogin"]);

            if (failedLoginCount >= maxLoginAttempt)
            {
                if (LastFailedLogin.AddMinutes(accountLockDuration) >= DateTime.Now)
                {
                    div_lblError.InnerHtml = "<div>Access has been locked.  <br/>Please try again in " + accountLockDuration + " minutes.</div>";
                    return true;
                }
                else
                {
                    Session["FailedLoginCount"] = null;
                    Session["LastFailedLogin"] = null;
                }
            }

            return false;
        }

        private bool IsLDAPLock(string username)
        {
            try
            {
                using (PrincipalContext ctx = new PrincipalContext(ContextType.Domain))
                {
                    string ldapName = username;
                    if (!username.ToLower().StartsWith(@"jabil\"))
                    {
                        ldapName = @"jabil\" + username;
                    }

                    using (UserPrincipal up = UserPrincipal.FindByIdentity(ctx, username))
                    {
                        if (up != null && up.AccountLockoutTime != null)
                        {
                            if (up.AccountLockoutTime.Value.AddMinutes(accountLockDuration) > DateTime.UtcNow)
                            {
                                div_lblError.InnerHtml = "<div>Your NTLogin had been locked.  <br/>Please try again in " + accountLockDuration + " minutes or contact IT to unlock your NTLogin</div>";
                                return true;
                            }
                        }
                    }
                }
            }
            catch (System.Runtime.InteropServices.COMException)
            {
                // Domain controller is unreachable (e.g. not on corporate network)
                // Skip LDAP lock check and fall through to normal validation
            }
            catch (PrincipalServerDownException)
            {
                // Active Directory server is down
            }

            return false;
        }



        protected void ClearSession()
        {
            string strRedirect = "";
            DateTime lastFailedLogin = new DateTime();
            int failedLoginCount = 0;

            if (Session[CachingNames.RedirectURL] != null)
                strRedirect = Session[CachingNames.RedirectURL].ToString();

            if (Session["FailedLoginCount"] != null)
            {
                int.TryParse(Session["FailedLoginCount"].ToString(), out failedLoginCount);
                lastFailedLogin = Convert.ToDateTime(Session["LastFailedLogin"]);
            }

            Session.Clear();

            if (strRedirect != "")
                Session[CachingNames.RedirectURL] = strRedirect;

            if (failedLoginCount != 0)
            {
                Session["FailedLoginCount"] = failedLoginCount;
                Session["LastFailedLogin"] = lastFailedLogin;
            }
        }
    }
}