import { groq } from "next-sanity";

export const siteSettingsQuery = groq`
  coalesce(
    *[_type == "siteSettings" && _id == "siteSettings"][0],
    *[_type == "siteSettings"][0]
  ){
    _id,
    title,
    homePageTabTitle,
    heroImage{
      ...,
      asset->{
        _id,
        metadata{
          dimensions{
            aspectRatio
          }
        }
      }
    },
    heroVideo{
      asset->{
        url
      }
    },
    mastheadDisplayMode,
    mastheadLogoHorizontalAlign,
    mastheadLogoVerticalAlign,
    siteLogo{
      ...,
      asset
    },
    backgroundOverlay{
      ...,
      asset
    },
    darkenMastheadImage,
    interiorPageTheme,
    shopLocked,
    navLogoOversized,
    navLogo{
      ...,
      asset
    },
    navbarItems,
    invertNavbarWordmark,
    invertNavbarLogo,
    siteIcon{
      ...,
      asset->{
        url,
        mimeType,
        originalFilename
      }
    },
    tagline,
    introText,
    closingTagline,
    exploreImage{
      ...,
      asset
    },
    featuredRecipe->{
      _id,
      title,
      "slug": slug.current,
      publishedAt,
      excerpt,
      youtubeUrl,
      priceTier,
      timeLabel,
      servesLabel,
      ingredients,
      instructions,
      image
    },
    closingImage{
      ...,
      asset
    },
    checkoutSuccessImage{
      ...,
      asset
    },
    copyrightLine,
    socialLinks[]{
      platform,
      url,
      handle
    }
  }
`;

export const pageBySlugQuery = groq`
  *[_type == "page" && slug.current == $slug][0]{
    _id,
    title,
    pageTabTitle,
    "slug": slug.current,
    tagline,
    excerpt,
    previewImage,
    bannerImage,
    content,
    photoGalleries[]{
      title,
      photos[]{
        ...,
        asset
      }
    }
  }
`;

export const pagesBySlugsQuery = groq`
  *[_type == "page" && slug.current in $slugs]{
    _id,
    title,
    pageTabTitle,
    "slug": slug.current,
    tagline,
    excerpt,
    previewImage,
    bannerImage,
    content,
    photoGalleries[]{
      title,
      photos[]{
        ...,
        asset
      }
    }
  }
`;

export const shopProductsQuery = groq`
  *[_type == "product" && coalesce(isVisible, true) == true] | order(coalesce(isFeatured, false) desc, coalesce(sortOrder, 999) asc, title asc){
    _id,
    title,
    "slug": slug.current,
    priceLabel,
    badge,
    summary,
    image,
    hoverImage,
    storefrontMockupGallery[]{
      image,
      label
    },
    additionalMockupImages[]{
      image,
      label
    },
    colorMockupGroups[]{
      color,
      images[]{
        image,
        label
      }
    },
    isFeatured,
    printfulSyncProductId,
    printfulExternalId,
    printfulThumbnailUrl,
    printfulBaseImageUrl,
    printfulVariantCount,
    printfulPriceLabel,
    productType,
    audienceTags,
    availableSizes,
    availableColors,
    printfulVariants[]{
      syncVariantId,
      externalId,
      name,
      catalogVariantId,
      retailPrice,
      currency,
      sku,
      size,
      color,
      availabilityStatus
    },
    printfulMockups[]{
      url,
      thumbnailUrl,
      type,
      label,
      isVisible,
      syncVariantIds
    },
    lastImportedAt
  }
`;

export const shopProductBySlugQuery = groq`
  *[_type == "product" && slug.current == $slug && coalesce(isVisible, true) == true]
  | order(dateTime(coalesce(lastImportedAt, _updatedAt)) desc)[0]{
    _id,
    title,
    "slug": slug.current,
    priceLabel,
    badge,
    summary,
    image,
    hoverImage,
    storefrontMockupGallery[]{
      image,
      label
    },
    additionalMockupImages[]{
      image,
      label
    },
    colorMockupGroups[]{
      color,
      images[]{
        image,
        label
      }
    },
    isFeatured,
    printfulSyncProductId,
    printfulExternalId,
    printfulThumbnailUrl,
    printfulBaseImageUrl,
    printfulVariantCount,
    printfulPriceLabel,
    productType,
    audienceTags,
    availableSizes,
    availableColors,
    printfulVariants[]{
      syncVariantId,
      externalId,
      name,
      catalogVariantId,
      retailPrice,
      currency,
      sku,
      size,
      color,
      availabilityStatus
    },
    printfulMockups[]{
      url,
      thumbnailUrl,
      type,
      label,
      isVisible,
      syncVariantIds
    },
    lastImportedAt
  }
`;

export const updatesQuery = groq`
  *[_type == "update"] | order(publishedAt desc){
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    image,
    content
  }
`;

export const latestUpdateQuery = groq`
  *[_type == "update"] | order(publishedAt desc)[0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    image,
    content
  }
`;

export const updateBySlugQuery = groq`
  *[_type == "update" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    image,
    content
  }
`;

export const recipesQuery = groq`
  *[_type == "recipe"] | order(publishedAt desc){
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    youtubeUrl,
    priceTier,
    timeLabel,
    servesLabel,
    ingredients,
    instructions,
    image,
    content
  }
`;

export const recipeBySlugQuery = groq`
  *[_type == "recipe" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    publishedAt,
    excerpt,
    youtubeUrl,
    priceTier,
    timeLabel,
    servesLabel,
    ingredients,
    instructions,
    image,
    content
  }
`;
