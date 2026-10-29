'use client';

// nano src/features/common/NewsletterEyebrow.jsx
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import AnimatedButton from '@/animations/components/AnimatedButton'; // NOTE: module id: 687989
import NavLink from '@/components/navigation/NavLink'; // NOTE: module id: 520237
import { analytics } from '@/libs/utils/analytics'; // NOTE: module id: 943348
import { useListSize } from '@/providers/ListSizeProvider'; // NOTE: module id: 637161
import SuccessPanel from '@/components/ui/NewsletterProfilePanel'; // NOTE: module id: 987025
import { suppressStarterPrompt } from '@/libs/config/starterPromptKey'; // NOTE: module id: 927627

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const starterPackSources = new Set([
  "starter-pack", "animations-library", "animations-detail", "animations-list-modal", 
  "mobile-detail", "paywall-block", "kit-reveal-ad", "kit-reveal-page", "homepage", 
  "pricing", "alternatives", "alternatives-top", "compare", "compare-top", "reference-rail"
]);

export function NewsletterEyebrow({ primary = "Weekly drop", secondary }) {
  const listSize = useListSize();
  const secondaryText = secondary ?? (listSize ? `Join ${listSize} developers and designers` : null);
  
  return (
    <div className="text-mono-sm flex flex-wrap items-center gap-x-12 gap-y-4 text-foreground-muted">
      <span className="text-foreground">{primary}</span>
      {secondaryText ? (
        <React.Fragment>
          <span aria-hidden="true" className="inline-block size-8 bg-brand" />
          <span>{secondaryText}</span>
        </React.Fragment>
      ) : null}
    </div>
  );
}

export default function NewsletterForm({
  source = "footer",
  eyebrow,
  buttonLabel = "Join",
  buttonSize = "sm",
  inputSize = "sm",
  emailPlaceholder = "you@studio.com",
  idPrefix,
  className = "",
  wantedComponent,
  onSuccess,
  compact = false,
  buttonFullWidth = false,
  consent = "checkbox",
  consentCopy = null,
  askName = true,
  successPanel = null,
  fieldStyle = "underline",
  fieldLabel = "Your email address"
}) {
  const [email, setEmail] = useState("");
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [submittedEmail, setSubmittedEmail] = useState("");
  
  const [firstName, setFirstName] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [profileSkipped, setProfileSkipped] = useState(false);
  
  const emailInputRef = useRef(null);
  const policyCheckboxRef = useRef(null);
  const formRef = useRef(null);
  const websiteInputRef = useRef(null);
  const viewTracked = useRef(false);
  const startTracked = useRef(false);
  
  const getTrackingPayload = () => ({
    source: source || "unknown",
    page_url: window.location.href
  });

  useEffect(() => {
    const formElement = formRef.current;
    if (!formElement || viewTracked.current || typeof IntersectionObserver === "undefined") return;
    
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting && !viewTracked.current) {
          viewTracked.current = true;
          analytics.track("newsletter_form_viewed", getTrackingPayload());
          observer.disconnect();
        }
      }
    }, { threshold: 0.4 });
    
    observer.observe(formElement);
    return () => observer.disconnect();
  }, [source]);

  const validateForm = ({ email, acceptedPolicy, consent }) => {
    const newErrors = {};
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(trimmedEmail)) {
      newErrors.email = "Enter a valid email address.";
    }
    
    if (consent === "checkbox" && !acceptedPolicy) {
      newErrors.policy = "Please accept the privacy policy to continue.";
    }
    
    return newErrors;
  };

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (isLoading || isSuccess) return;
    
    const validationErrors = validateForm({ email, acceptedPolicy, consent });
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      analytics.track("newsletter_form_validation_failed", {
        ...getTrackingPayload(),
        errors: Object.keys(validationErrors)
      });
      
      if (validationErrors.email) {
        emailInputRef.current?.focus();
      } else if (validationErrors.policy) {
        policyCheckboxRef.current?.focus();
      }
      return;
    }
    
    setErrors({});
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source: source,
          wantedComponent: wantedComponent || undefined,
          website: websiteInputRef.current?.value || undefined,
          metadata: {
            page_url: window.location.href,
            referrer: typeof document !== "undefined" && document.referrer ? document.referrer : null
          }
        })
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(responseData.error || "Could not subscribe");
      }
      
      analytics.track("newsletter_subscribed", {
        source: source || "unknown",
        page_url: window.location.href
      });
      
      if (starterPackSources.has(source)) {
        toast.success("Almost there. Open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after.");
      } else {
        toast.success("Almost there. Open the email from julian@annnimate.com and click confirm.");
      }
      
      suppressStarterPrompt();
      onSuccess?.(email.trim());
      setSubmittedEmail(email.trim());
      
      if (askName) {
        analytics.track("newsletter_profile_shown", getTrackingPayload());
      } else {
        setProfileSkipped(true);
      }
      
      setIsSuccess(true);
      setEmail("");
    } catch (error) {
      toast.error(error.message || "Something went wrong. Try again?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (isProfileLoading) return;
    
    const trimmedName = firstName.trim();
    if (!trimmedName) {
      handleProfileSkip();
      return;
    }
    
    setIsProfileLoading(true);
    try {
      await fetch("/api/newsletter/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: submittedEmail,
          firstName: trimmedName
        })
      });
      analytics.track("newsletter_profile_completed", getTrackingPayload());
    } catch (error) {
      // Ignore errors for profile submission
    } finally {
      setIsProfileLoading(false);
      setProfileSkipped(true);
    }
  };

  const handleProfileSkip = () => {
    if (!isProfileLoading) {
      analytics.track("newsletter_profile_skipped", getTrackingPayload());
      setProfileSkipped(true);
    }
  };

  const baseId = idPrefix || source;
  const firstNameId = `${baseId}-newsletter-firstname`;
  const emailId = `${baseId}-newsletter-email`;
  const policyId = `${baseId}-newsletter-policy`;
  const emailErrorId = `${emailId}-error`;
  const policyErrorId = `${policyId}-error`;
  
  const isBoxed = fieldStyle === "boxed";
  const inputBaseClasses = `${inputSize === "lg" ? (isBoxed ? "text-body-lg py-14" : "text-body-lg pt-10 pb-20") : (isBoxed ? "text-body-sm py-10" : "text-body-sm pt-8 pb-16")} flex-1 min-w-0 rounded-none bg-transparent px-0 text-foreground placeholder:text-foreground-muted/60 focus:outline-none disabled:opacity-50 transition-colors duration-(--duration-quick) ease-(--ease-expo-out)`;
  const inputBorderClasses = isBoxed 
    ? (errors.email ? "border border-brand bg-surface px-16" : "border border-foreground/25 bg-surface px-16 focus:border-foreground") 
    : (errors.email ? "border-b border-brand" : "border-b border-foreground/20 focus:border-foreground");

  return (
    <form
      ref={formRef}
      onSubmit={isSuccess ? handleProfileSubmit : handleSubscribe}
      noValidate={true}
      className={`flex flex-col gap-16 ${className}`}
    >
      {eyebrow || null}
      
      {isSuccess ? (
        profileSkipped ? (
          successPanel || (
            <SuccessPanel 
              email={submittedEmail}
              wantsPack={starterPackSources.has(source)}
              source={source || "unknown"}
              onChangeAddress={() => {
                setEmail(submittedEmail);
                setIsSuccess(false);
                setProfileSkipped(false);
              }}
            />
          )
        ) : (
          <React.Fragment>
            <div className="flex flex-col gap-6">
              <p className="text-body-sm text-foreground">
                {starterPackSources.has(source) 
                  ? "Almost there - open the email from julian@annnimate.com and confirm. Your Starter Pack lands right after." 
                  : "Almost there - open the email from julian@annnimate.com and click confirm."}
              </p>
              <p className="text-body-sm text-foreground/70">
                One quick thing: what should we call you?
              </p>
            </div>
            
            <div className="relative flex flex-col">
              <label htmlFor={firstNameId} className="sr-only">First name</label>
              <input
                id={firstNameId}
                type="text"
                autoComplete="given-name"
                placeholder="First name (optional)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isProfileLoading}
                autoFocus={true}
                className={`${inputBaseClasses} border-b border-foreground/20 focus:border-foreground`}
              />
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-16">
              <button
                type="button"
                onClick={handleProfileSkip}
                disabled={isProfileLoading}
                className="text-mono-sm text-foreground-muted transition-colors hover:text-foreground disabled:opacity-50"
              >
                Skip
              </button>
              <AnimatedButton
                type="submit"
                theme="brand"
                size={buttonSize}
                loading={isProfileLoading}
                disabled={!firstName.trim()}
              >
                Save
              </AnimatedButton>
            </div>
          </React.Fragment>
        )
      ) : (
        <React.Fragment>
          <div className="relative flex flex-col">
            <label 
              htmlFor={emailId} 
              className={isBoxed ? "text-mono-sm mb-8 text-foreground" : "sr-only"}
            >
              {isBoxed ? fieldLabel : "Your email"}
            </label>
            
            {errors.email ? (
              <p 
                id={emailErrorId} 
                role="alert" 
                className={isBoxed ? "text-mono-sm order-last mt-6 text-brand" : "text-mono-sm absolute bottom-full left-0 right-0 mb-6 text-brand"}
              >
                {errors.email}
              </p>
            ) : null}
            
            <input
              ref={emailInputRef}
              id={emailId}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={emailPlaceholder}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (!startTracked.current) {
                  startTracked.current = true;
                  analytics.track("newsletter_form_started", getTrackingPayload());
                }
                if (errors.email) {
                  setErrors((prev) => {
                    const { email, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              disabled={isLoading}
              aria-invalid={errors.email ? "true" : "false"}
              aria-describedby={errors.email ? emailErrorId : undefined}
              className={`${inputBaseClasses} ${inputBorderClasses}`}
            />
          </div>
          
          {/* Honeypot field */}
          <div aria-hidden="true" className="absolute -left-[9999px] size-px overflow-hidden">
            <label htmlFor={`${baseId}-newsletter-website`}>Website</label>
            <input
              ref={websiteInputRef}
              id={`${baseId}-newsletter-website`}
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>
          
          <div className="relative">
            <div className={compact ? "flex flex-col gap-12" : "flex flex-wrap items-start justify-between gap-16"}>
              {consent === "notice" ? (
                <p className="text-mono-sm m-0 max-w-[36ch] self-center text-foreground-muted">
                  {consentCopy?.before || "By signing up you agree to the"}
                  {" "}
                  <NavLink href="/privacy" className="text-foreground">
                    {consentCopy?.link || "privacy policy"}
                  </NavLink>
                  {consentCopy?.after || "."}
                </p>
              ) : (
                <label 
                  htmlFor={policyId} 
                  className={`flex cursor-pointer items-center gap-8 self-start text-foreground-muted ${compact ? "text-body-sm" : "text-mono-sm"}`}
                >
                  <input
                    ref={policyCheckboxRef}
                    id={policyId}
                    type="checkbox"
                    checked={acceptedPolicy}
                    onChange={(e) => {
                      setAcceptedPolicy(e.target.checked);
                      if (errors.policy && e.target.checked) {
                        setErrors((prev) => {
                          const { policy, ...rest } = prev;
                          return rest;
                        });
                      }
                    }}
                    disabled={isLoading}
                    aria-invalid={errors.policy ? "true" : "false"}
                    aria-describedby={errors.policy ? policyErrorId : undefined}
                    className={`size-18 cursor-pointer appearance-none bg-transparent transition-colors checked:border-brand checked:bg-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-50 ${errors.policy ? "border border-brand" : "border border-foreground/30"}`}
                  />
                  <span className="inline-flex flex-wrap items-center gap-x-6">
                    <span>I agree to the</span>
                    <NavLink href="/privacy" className="text-foreground">privacy policy</NavLink>
                  </span>
                </label>
              )}
              
              <AnimatedButton
                type="submit"
                theme="brand"
                size={buttonSize}
                loading={isLoading}
                className={buttonFullWidth ? "w-full" : (compact ? "self-end" : undefined)}
              >
                {buttonLabel}
              </AnimatedButton>
            </div>
            
            {errors.policy ? (
              <p id={policyErrorId} role="alert" className="text-mono-sm absolute left-0 right-0 top-full mt-8 text-brand">
                {errors.policy}
              </p>
            ) : null}
          </div>
        </React.Fragment>
      )}
    </form>
  );
}
