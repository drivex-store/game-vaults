// NOTE: module id: 516799
import { isOfferActive, prices, landingPrices, quarterlyPrices, studioSeatsPrices } from '@/features/pricing/utils/packSlugs'; // NOTE: module id: 825740
import { studioTotalCents, STUDIO_CYCLE_MONTHS } from '@/features/pricing/utils/studioPricing'; // NOTE: module id: 59011

export const STUDIO_SOLO_CENTS = {
  quarterly: 8700,
  yearly: 24000
};

const getStudioPrice = (cycle) => studioTotalCents(2, STUDIO_SOLO_CENTS[cycle], STUDIO_CYCLE_MONTHS[cycle]) / 100;

const config = {
  appName: "Annnimate",
  appDescription: "Production GSAP motion components for React and Vue. Every component shipped on a real brand site before it reached the library. By Good Fella.",
  domainName: "annnimate.com",
  crisp: {
    id: "",
    onlyShowOnRoutes: ["/"]
  },
  stripe: {
    plans: [
      {
        isFeatured: true,
        priceId: prices?.pro,
        name: "Pro",
        description: "Perfect for individual designers and developers.",
        price: 199,
        priceAnchor: null,
        userAmount: 1,
        isBillingCycle: "yearly",
        features: [
          { name: "Full access to animation library" },
          { name: "All code formats (HTML, React, Webflow)" },
          { name: "GSAP integration" },
          { name: "Save & organize favorites" },
          { name: "New animations monthly" },
          { name: "Documentation & support" },
          { name: "All future updates" }
        ]
      },
      {
        priceId: prices?.team,
        name: "Team",
        description: "For agencies and teams collaborating on projects.",
        price: 300,
        priceAnchor: null,
        isBillingCycle: "yearly",
        userAmount: 3,
        additionalInfo: "Includes 3 seats, +€159/year per additional seat",
        features: [
          { name: "Everything in Pro" },
          { name: "Minimum 3 team members included" },
          { name: "Shared team workspace" },
          { name: "Team collaboration tools" },
          { name: "Priority support" },
          { name: "Additional seats: €159/year each" }
        ]
      }
    ],
    landingPlans: [
      {
        key: "solo",
        name: "Solo",
        cta: "Get Solo",
        surface: "dark",
        isPopular: true,
        seatTag: "1 seat",
        pitch: "For one developer working solo or on freelance work.",
        yearly: {
          price: 199,
          listPrice: 240,
          priceId: landingPrices?.soloYearly,
          cycleLabel: "/year"
        },
        quarterly: {
          price: 20,
          listPrice: 29,
          cycleTotal: 60,
          listCycleTotal: 87,
          priceId: quarterlyPrices?.soloQuarterly,
          cycleLabel: "/month"
        },
        features: [
          { componentCount: true },
          { shippedRecently: true },
          "React, Vue and HTML",
          "MCP server for Cursor and Claude Code",
          "New components as they ship",
          "Documentation and support"
        ]
      },
      {
        key: "studio-seats",
        name: "Studio",
        cta: "Get Studio",
        surface: "surface",
        perSeat: true,
        minSeats: 2,
        maxSeats: 20,
        soloCents: STUDIO_SOLO_CENTS,
        seatTag: "2 to 20 seats",
        pitch: "For a studio or team shipping client work. Every seat after the first costs less.",
        yearly: {
          price: getStudioPrice("yearly"),
          listPrice: getStudioPrice("yearly"),
          priceId: studioSeatsPrices?.studioSeatsYearly,
          cycleLabel: "/year"
        },
        quarterly: {
          price: getStudioPrice("quarterly") / 3,
          listPrice: getStudioPrice("quarterly") / 3,
          cycleTotal: getStudioPrice("quarterly"),
          listCycleTotal: getStudioPrice("quarterly"),
          priceId: studioSeatsPrices?.studioSeatsQuarterly,
          cycleLabel: "/month"
        },
        features: [
          "Everything in Solo, for every seat",
          "10% off every seat after the first, up to 40%",
          "Add or remove seats any time",
          "MCP server for the whole team",
          "Priority support"
        ]
      }
    ],
    addons: []
  },
  aws: {
    bucket: "bucket-name",
    bucketUrl: "https://bucket-name.s3.amazonaws.com/",
    cdn: "https://cdn-id.cloudfront.net/"
  },
  resend: {
    fromNoReply: "Annnimate <noreply@annnimate.com>",
    fromAdmin: "Team at Annnimate <team@annnimate.com>",
    supportEmail: "support@annnimate.com",
    contactEmail: "contact@annnimate.com"
  },
  colors: {
    main: "#b3fca0"
  },
  auth: {
    loginUrl: "/login",
    callbackUrl: "/animations"
  },
  animationStats: {
    totalCount: 123,
    displayCount: "120+"
  },
  featureFlags: {
    earlyAccessFeatures: ["ai_code_generation_v2", "animation_composer", "team_workspaces", "advanced_customization"],
    adminOnlyFeatures: [],
    disabledFeatures: []
  },
  adminMetrics: {
    monthlyInfraCostEur: 20
  }
};

export default config;

export function effectiveCyclePrice(planConfig, timestamp = Date.now()) {
  if (!planConfig) return null;
  if (isOfferActive(timestamp)) {
    return planConfig.price;
  }
  return planConfig.listPrice ?? planConfig.price;
}

export function effectiveCycleTotal(planConfig, timestamp = Date.now()) {
  if (!planConfig?.cycleTotal) return null;
  if (isOfferActive(timestamp)) {
    return planConfig.cycleTotal;
  }
  return planConfig.listCycleTotal ?? planConfig.cycleTotal;
}
