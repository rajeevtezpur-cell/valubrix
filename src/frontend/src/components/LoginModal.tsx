import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import type { AuthUser } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import OTPInput from "./OTPInput";

type Tab = "mobile" | "email";
type Step = "input" | "otp";

export default function LoginModal() {
  const {
    showLoginModal,
    closeLoginModal,
    login,
    openRoleSelect,
    intendedPortal,
  } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("mobile");
  const [step, setStep] = useState<Step>("input");
  const [identifier, setIdentifier] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [timer, setTimer] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLoginModal) {
      setStep("input");
      setIdentifier("");
      setOtp(["", "", "", "", "", ""]);
      setOtpError("");
      setTimer(60);
      setTimerActive(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [showLoginModal]);

  useEffect(() => {
    if (!timerActive) return;
    if (timer === 0) {
      setTimerActive(false);
      return;
    }
    const t = setTimeout(() => setTimer((p) => p - 1), 1000);
    return () => clearTimeout(t);
  }, [timer, timerActive]);

  const handleSendOtp = () => {
    if (!identifier.trim()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setTimer(60);
      setTimerActive(true);
    }, 600);
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setTimer(60);
    setTimerActive(true);
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code !== "123456") {
      setOtpError("Invalid OTP. Use 123456 for demo.");
      return;
    }
    setOtpError("");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      let existingUser: AuthUser | null = null;
      try {
        const db = JSON.parse(localStorage.getItem("valubrix_user_db") || "{}");
        existingUser = db[identifier] ?? null;
      } catch {
        /* ignore */
      }

      if (existingUser) {
        login(existingUser);
        closeLoginModal();
        redirectAfterLogin(existingUser.role, intendedPortal);
      } else {
        const newUser: AuthUser = {
          username: identifier,
          fullName: "",
          city: "",
          role: "buyer",
          ...(tab === "mobile"
            ? { mobile: identifier }
            : { email: identifier }),
        };
        login(newUser);
        closeLoginModal();
        openRoleSelect();
      }
    }, 500);
  };

  const redirectAfterLogin = (
    role: AuthUser["role"],
    portal: "buyer" | "seller" | "banker" | null,
  ) => {
    const dest = portal ?? roleToPortal(role);
    if (dest === "buyer") navigate({ to: "/buyer" });
    else if (dest === "seller") navigate({ to: "/seller" });
    else if (dest === "banker") navigate({ to: "/bank" });
    else navigate({ to: "/" });
  };

  if (!showLoginModal) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="login-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-ocid="login.modal"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1000,
          background: "rgba(10,15,30,0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) closeLoginModal();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 24 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          style={{
            background: "linear-gradient(145deg, #121B35 0%, #0A0F1E 100%)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 24,
            width: "100%",
            maxWidth: 440,
            boxShadow:
              "0 40px 120px rgba(0,0,0,0.7), 0 0 40px rgba(201,168,76,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background:
                "linear-gradient(90deg, transparent, #C9A84C, #D4AF37, transparent)",
            }}
          />

          <div style={{ padding: "36px 36px 32px" }}>
            <button
              type="button"
              data-ocid="login.close_button"
              onClick={closeLoginModal}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
                lineHeight: 1,
                transition: "all 0.2s",
              }}
            >
              ×
            </button>

            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <img
                src="/assets/uploads/5EB5878E-7937-4598-9486-6156F9B2EB9F-3-1.png"
                alt="ValuBrix"
                style={{
                  height: 52,
                  width: "auto",
                  margin: "0 auto 12px",
                  display: "block",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                Your intelligent property companion
              </p>
              {intendedPortal && (
                <p
                  style={{
                    marginTop: 10,
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Login to continue to your portal and access
                  <br />
                  personalized property insights
                </p>
              )}
            </div>

            {step === "input" && (
              <>
                <div
                  style={{
                    display: "flex",
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: 4,
                    marginBottom: 24,
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {(["mobile", "email"] as Tab[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      data-ocid={`login.${t}.tab`}
                      onClick={() => {
                        setTab(t);
                        setIdentifier("");
                      }}
                      style={{
                        flex: 1,
                        padding: "8px 0",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                        transition: "all 0.2s",
                        background:
                          tab === t ? "rgba(201,168,76,0.15)" : "transparent",
                        color: tab === t ? "#C9A84C" : "rgba(255,255,255,0.4)",
                        boxShadow:
                          tab === t
                            ? "inset 0 0 0 1px rgba(201,168,76,0.3)"
                            : "none",
                      }}
                    >
                      {t === "mobile" ? "📱 Mobile OTP" : "✉️ Email OTP"}
                    </button>
                  ))}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="login-identifier"
                    style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: 13,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    {tab === "mobile" ? "Mobile Number" : "Email Address"}
                  </label>
                  <input
                    id="login-identifier"
                    ref={inputRef}
                    data-ocid="login.input"
                    type={tab === "mobile" ? "tel" : "email"}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendOtp();
                    }}
                    placeholder={
                      tab === "mobile" ? "+91 98765 43210" : "you@example.com"
                    }
                    style={{
                      width: "100%",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 12,
                      padding: "13px 16px",
                      color: "white",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "rgba(201,168,76,0.5)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255,255,255,0.12)";
                    }}
                  />
                </div>

                <button
                  type="button"
                  data-ocid="login.send_otp.primary_button"
                  onClick={handleSendOtp}
                  disabled={isLoading || !identifier.trim()}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    background: "linear-gradient(135deg, #C9A84C, #D4AF37)",
                    color: "#0A0F1E",
                    fontWeight: 700,
                    fontSize: 14,
                    borderRadius: 12,
                    border: "none",
                    cursor:
                      isLoading || !identifier.trim()
                        ? "not-allowed"
                        : "pointer",
                    opacity: isLoading || !identifier.trim() ? 0.6 : 1,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
                  }}
                >
                  {isLoading ? "Sending..." : "Send OTP"}
                </button>
              </>
            )}

            {step === "otp" && (
              <>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                    Enter the 6-digit OTP sent to
                  </p>
                  <p
                    style={{
                      color: "#C9A84C",
                      fontSize: 14,
                      fontWeight: 600,
                      marginTop: 4,
                    }}
                  >
                    {identifier}
                  </p>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <OTPInput value={otp} onChange={setOtp} error={otpError} />
                </div>

                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  {timerActive ? (
                    <span
                      style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}
                    >
                      Resend in{" "}
                      <span
                        style={{
                          color: "#C9A84C",
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {timer}s
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      data-ocid="login.resend.button"
                      onClick={handleResend}
                      style={{
                        color: "#C9A84C",
                        fontSize: 13,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  data-ocid="login.verify.primary_button"
                  onClick={handleVerify}
                  disabled={isLoading || otp.join("").length < 6}
                  style={{
                    width: "100%",
                    padding: "14px 0",
                    background: "linear-gradient(135deg, #C9A84C, #D4AF37)",
                    color: "#0A0F1E",
                    fontWeight: 700,
                    fontSize: 14,
                    borderRadius: 12,
                    border: "none",
                    cursor:
                      isLoading || otp.join("").length < 6
                        ? "not-allowed"
                        : "pointer",
                    opacity: isLoading || otp.join("").length < 6 ? 0.6 : 1,
                    transition: "all 0.2s",
                    boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
                    marginBottom: 12,
                  }}
                >
                  {isLoading ? "Verifying..." : "Verify & Continue"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep("input")}
                  style={{
                    width: "100%",
                    padding: "10px 0",
                    background: "transparent",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  ← Change {tab === "mobile" ? "number" : "email"}
                </button>

                <p
                  style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: 11,
                    textAlign: "center",
                    marginTop: 8,
                  }}
                >
                  Demo OTP: 123456
                </p>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function roleToPortal(
  role: AuthUser["role"],
): "buyer" | "seller" | "banker" | null {
  if (role === "buyer") return "buyer";
  if (role === "seller") return "seller";
  if (role === "banker" || role === "bankOfficer") return "banker";
  return null;
}
