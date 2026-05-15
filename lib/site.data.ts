import type { TypedObject } from "@portabletext/types";
import { sanityClient } from "@/lib/sanity.client";
import { sanityEnv } from "@/lib/sanity.env";
import { sanityWriteClient } from "@/lib/sanity.write.client";
import {
  pageBySlugQuery,
  pagesBySlugsQuery,
  latestUpdateQuery,
  recipeBySlugQuery,
  recipesQuery,
  shopProductBySlugQuery,
  shopProductsQuery,
  siteSettingsQuery,
  updateBySlugQuery,
  updatesQuery,
} from "@/lib/sanity.queries";

export type CmsPage = {
  _id?: string;
  title?: string;
  pageTabTitle?: string;
  slug?: string;
  tagline?: string;
  excerpt?: string;
  previewImage?: {
    asset?: {
      _ref?: string;
      _type?: string;
    };
  };
  bannerImage?: {
    asset?: {
      _ref?: string;
      _type?: string;
    };
  };
  content?: TypedObject[];
  photoGalleries?: Array<{
    title?: string;
    photos?: Array<{
      asset?: {
        _ref?: string;
        _type?: string;
      };
    }>;
  }>;
};

export type CmsProduct = {
  _id?: string;
  title?: string;
  slug?: string;
  priceLabel?: string;
  badge?: string;
  summary?: string;
  image?: {
    asset?: {
      _ref?: string;
      _type?: string;
    };
  };
  hoverImage?: {
    asset?: {
      _ref?: string;
      _type?: string;
    };
  };
  storefrontMockupGallery?: Array<{
    image?: {
      asset?: {
        _ref?: string;
        _type?: string;
      };
    };
    label?: string;
  }>;
  additionalMockupImages?: Array<{
    image?: {
      asset?: {
        _ref?: string;
        _type?: string;
      };
    };
    label?: string;
  }>;
  colorMockupGroups?: Array<{
    color?: string;
    images?: Array<{
      image?: {
        asset?: {
          _ref?: string;
          _type?: string;
        };
      };
      label?: string;
    }>;
  }>;
  isFeatured?: boolean;
  printfulSyncProductId?: string;
  printfulExternalId?: string;
  printfulThumbnailUrl?: string;
  printfulBaseImageUrl?: string;
  printfulVariantCount?: number;
  printfulPriceLabel?: string;
  productType?: string;
  audienceTags?: string[];
  availableSizes?: string[];
  availableColors?: string[];
  printfulVariants?: Array<{
    syncVariantId?: string;
    externalId?: string;
    name?: string;
    catalogVariantId?: string;
    retailPrice?: string;
    currency?: string;
    sku?: string;
    size?: string;
    color?: string;
    availabilityStatus?: string;
  }>;
  printfulMockups?: Array<{
    url?: string;
    thumbnailUrl?: string;
    type?: string;
    label?: string;
    isVisible?: boolean;
    syncVariantIds?: string[];
  }>;
  lastImportedAt?: string;
};

type ImageWithMetadata = CmsPage["previewImage"] & {
  asset?: {
    _ref?: string;
    _type?: string;
    metadata?: {
      dimensions?: {
        aspectRatio?: number;
      };
    };
  };
};

type SiteLogo = ImageWithMetadata & {
  alt?: string;
  fallbackText?: string;
};

type SiteFile = {
  alt?: string;
  asset?: {
    url?: string;
    mimeType?: string;
    originalFilename?: string;
  };
};

type SocialLink = {
  platform?: string;
  url?: string;
  handle?: string;
};

export type CmsArticle = {
  _id?: string;
  title?: string;
  slug?: string;
  publishedAt?: string;
  excerpt?: string;
  youtubeUrl?: string;
  priceTier?: string;
  timeLabel?: string;
  servesLabel?: string;
  ingredients?: string[];
  instructions?: string[];
  image?: {
    asset?: {
      _ref?: string;
      _type?: string;
    };
  };
  content?: TypedObject[];
};

type SiteSettings = {
  _id?: string;
  title?: string;
  homePageTabTitle?: string;
  heroImage?: ImageWithMetadata;
  mastheadDisplayMode?: "fit" | "fullscreen";
  mastheadLogoHorizontalAlign?: "left" | "center";
  mastheadLogoVerticalAlign?: "top" | "center";
  siteLogo?: SiteLogo;
  backgroundOverlay?: SiteLogo;
  darkenMastheadImage?: boolean;
  interiorPageTheme?: "brand" | "light";
  shopLocked?: boolean;
  navLogoOversized?: boolean;
  navLogo?: SiteLogo;
  navbarItems?: string[];
  invertNavbarWordmark?: boolean;
  invertNavbarLogo?: boolean;
  siteIcon?: SiteFile;
  heroVideo?: {
    asset?: {
      url?: string;
    };
  };
  tagline?: string;
  introText?: string;
  closingTagline?: string;
  exploreImage?: SiteLogo;
  featuredRecipe?: CmsArticle;
  closingImage?: SiteLogo;
  checkoutSuccessImage?: SiteLogo;
  copyrightLine?: string;
  socialLinks?: SocialLink[];
};

type SitePageDefinition = {
  slug: string;
  navLabel: string;
  fallbackTitle: string;
  fallbackExcerpt: string;
};

export const SITE_PAGES: SitePageDefinition[] = [
  {
    slug: "shop",
    navLabel: "Shop",
    fallbackTitle: "Shop",
    fallbackExcerpt: "A simple home for merch, gear, and whatever comes next.",
  },
  {
    slug: "updates",
    navLabel: "Updates",
    fallbackTitle: "Updates",
    fallbackExcerpt: "Latest news, products, stories, and updates from your brand.",
  },
  {
    slug: "recipes",
    navLabel: "Recipes",
    fallbackTitle: "Recipes",
    fallbackExcerpt: "Featured catches and simple cooking ideas from the water to the plate.",
  },
  {
    slug: "explore",
    navLabel: "Explore",
    fallbackTitle: "Explore",
    fallbackExcerpt: "Start with the brand story or send through an enquiry.",
  },
];

const PAGE_DEFINITION_MAP = new Map(SITE_PAGES.map((page) => [page.slug, page]));

export async function getPageBySlug(slug: string) {
  if (!sanityEnv.isConfigured) {
    return null;
  }

  try {
    return await sanityClient.fetch<CmsPage>(
      pageBySlugQuery,
      { slug },
      {
        next: { revalidate: 60 },
      }
    );
  } catch {
    return null;
  }
}

export async function getSiteData() {
  const defaults = {
    title: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand",
    tagline: "",
    homePageTabTitle: "Home",
    introText: "",
    closingTagline: "",
    copyrightLine: `Copyright ${new Date().getFullYear()} ${process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand"}. All rights reserved.`,
    socialLinks: [] as SocialLink[],
    heroImage: undefined,
    mastheadDisplayMode: "fit" as const,
    mastheadLogoHorizontalAlign: "left" as const,
    mastheadLogoVerticalAlign: "top" as const,
    siteLogo: undefined,
    backgroundOverlay: undefined,
    darkenMastheadImage: true,
    interiorPageTheme: "light" as const,
    shopLocked: false,
    navLogoOversized: true,
    navLogo: undefined,
    navbarItems: ["shop", "updates", "recipes", "explore"],
    invertNavbarWordmark: true,
    invertNavbarLogo: false,
    siteIcon: undefined,
    heroVideoUrl: "",
    siteLogoAlt: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand",
    siteLogoFallbackText: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand",
    backgroundOverlayAlt: "Site overlay",
    backgroundOverlayFallbackText: "Site overlay",
    navLogoAlt: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand",
    navLogoFallbackText: process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Your Brand",
    featuredRecipe: undefined,
    exploreImage: undefined,
    closingImage: undefined,
    checkoutSuccessImage: undefined,
    pages: SITE_PAGES.map((page) => ({
      ...page,
      title: page.fallbackTitle,
      excerpt: page.fallbackExcerpt,
      content: [],
      previewImage: undefined,
      isPublished: false,
    })),
  };

  if (!sanityEnv.isConfigured) {
    return defaults;
  }

  try {
    const [settings, pages] = await Promise.all([
      sanityClient.fetch<SiteSettings>(siteSettingsQuery, {}, { next: { revalidate: 60 } }),
      sanityClient.fetch<CmsPage[]>(
        pagesBySlugsQuery,
        { slugs: SITE_PAGES.map((page) => page.slug) },
        { next: { revalidate: 60 } }
      ),
    ]);

    const pagesBySlug = new Map((pages || []).map((page) => [page.slug, page]));

    return {
      title: settings?.title || defaults.title,
      homePageTabTitle: settings?.homePageTabTitle || defaults.homePageTabTitle,
      tagline: settings?.tagline || defaults.tagline,
      introText: settings?.introText || defaults.introText,
      closingTagline: settings?.closingTagline || defaults.closingTagline,
      exploreImage: settings?.exploreImage,
      copyrightLine: settings?.copyrightLine || defaults.copyrightLine,
      socialLinks: (settings?.socialLinks || []).filter((item) => item.url && item.platform),
      heroImage: settings?.heroImage,
      mastheadDisplayMode: settings?.mastheadDisplayMode || defaults.mastheadDisplayMode,
      mastheadLogoHorizontalAlign:
        settings?.mastheadLogoHorizontalAlign || defaults.mastheadLogoHorizontalAlign,
      mastheadLogoVerticalAlign:
        settings?.mastheadLogoVerticalAlign || defaults.mastheadLogoVerticalAlign,
      siteLogo: settings?.siteLogo,
      backgroundOverlay: settings?.backgroundOverlay,
      darkenMastheadImage: settings?.darkenMastheadImage ?? defaults.darkenMastheadImage,
      interiorPageTheme: settings?.interiorPageTheme || defaults.interiorPageTheme,
      shopLocked: settings?.shopLocked ?? defaults.shopLocked,
      navLogoOversized: settings?.navLogoOversized ?? defaults.navLogoOversized,
      navLogo: settings?.navLogo,
      navbarItems:
        settings?.navbarItems?.filter((item): item is string => Boolean(item)) || defaults.navbarItems,
      invertNavbarWordmark: settings?.invertNavbarWordmark ?? defaults.invertNavbarWordmark,
      invertNavbarLogo: settings?.invertNavbarLogo ?? defaults.invertNavbarLogo,
      siteIcon: settings?.siteIcon,
      heroVideoUrl: settings?.heroVideo?.asset?.url || defaults.heroVideoUrl,
      siteLogoAlt: settings?.siteLogo?.alt || defaults.siteLogoAlt,
      siteLogoFallbackText: settings?.siteLogo?.fallbackText || defaults.siteLogoFallbackText,
      backgroundOverlayAlt:
        settings?.backgroundOverlay?.alt || defaults.backgroundOverlayAlt,
      backgroundOverlayFallbackText:
        settings?.backgroundOverlay?.fallbackText || defaults.backgroundOverlayFallbackText,
      navLogoAlt: settings?.navLogo?.alt || defaults.navLogoAlt,
      navLogoFallbackText: settings?.navLogo?.fallbackText || defaults.navLogoFallbackText,
      featuredRecipe: settings?.featuredRecipe,
      closingImage: settings?.closingImage,
      checkoutSuccessImage: settings?.checkoutSuccessImage,
      pages: SITE_PAGES.map((page) => {
        const cmsPage = pagesBySlug.get(page.slug);

        return {
          ...page,
          title: cmsPage?.title || page.fallbackTitle,
          pageTabTitle: cmsPage?.pageTabTitle || cmsPage?.title || page.fallbackTitle,
          tagline:
            cmsPage?.tagline ||
            (page.slug === "shop" ? "Apparel built for your next adventure." : ""),
          excerpt: cmsPage?.excerpt || page.fallbackExcerpt,
          content: cmsPage?.content || [],
          previewImage: cmsPage?.previewImage,
          isPublished: Boolean(cmsPage?._id),
        };
      }),
    };
  } catch {
    return defaults;
  }
}

export function getPageDefinition(slug: string) {
  return PAGE_DEFINITION_MAP.get(slug) ?? null;
}

export async function getLatestUpdate() {
  if (!sanityEnv.isConfigured) {
    return null as CmsArticle | null;
  }

  try {
    return await sanityClient.fetch<CmsArticle | null>(latestUpdateQuery, {}, { next: { revalidate: 60 } });
  } catch {
    return null;
  }
}

export async function getUpdates() {
  if (!sanityEnv.isConfigured) {
    return [] as CmsArticle[];
  }

  try {
    return await sanityClient.fetch<CmsArticle[]>(updatesQuery, {}, { next: { revalidate: 60 } });
  } catch {
    return [];
  }
}

export async function getUpdateBySlug(slug: string) {
  if (!sanityEnv.isConfigured) {
    return null as CmsArticle | null;
  }

  try {
    return await sanityClient.fetch<CmsArticle | null>(updateBySlugQuery, { slug }, { next: { revalidate: 60 } });
  } catch {
    return null;
  }
}

export async function getRecipes() {
  if (!sanityEnv.isConfigured) {
    return [] as CmsArticle[];
  }

  try {
    return await sanityClient.fetch<CmsArticle[]>(recipesQuery, {}, { next: { revalidate: 60 } });
  } catch {
    return [];
  }
}

export async function getRecipeBySlug(slug: string) {
  if (!sanityEnv.isConfigured) {
    return null as CmsArticle | null;
  }

  try {
    return await sanityClient.fetch<CmsArticle | null>(recipeBySlugQuery, { slug }, { next: { revalidate: 60 } });
  } catch {
    return null;
  }
}

export async function getShopProducts() {
  if (!sanityEnv.isConfigured) {
    return [] as CmsProduct[];
  }

  const client = sanityWriteClient ?? sanityClient;

  try {
    return await client.fetch<CmsProduct[]>(
      shopProductsQuery,
      {},
      {
        next: { revalidate: 60 },
      }
    );
  } catch {
    return [];
  }
}

export async function getShopProductBySlug(slug: string) {
  if (!sanityEnv.isConfigured) {
    return null as CmsProduct | null;
  }

  const client = sanityWriteClient ?? sanityClient;

  try {
    return await client.fetch<CmsProduct | null>(
      shopProductBySlugQuery,
      { slug },
      {
        next: { revalidate: 60 },
      }
    );
  } catch {
    return null;
  }
}
