const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? process.env.SANITY_PROJECT_ID;
const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET ??
  process.env.SANITY_DATASET ??
  "production";
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2024-06-01";
const SPEAROMANIACS_PRODUCTION_PROJECT_ID = "5v60gbu6";

if (projectId === SPEAROMANIACS_PRODUCTION_PROJECT_ID) {
  throw new Error(
    "This is the storefront template. Create your own Sanity project and replace NEXT_PUBLIC_SANITY_PROJECT_ID; do not use the Spearomaniacs production project."
  );
}

const isConfigured = Boolean(projectId);

export const sanityEnv = {
  projectId: projectId ?? "",
  dataset,
  apiVersion,
  isConfigured,
};
