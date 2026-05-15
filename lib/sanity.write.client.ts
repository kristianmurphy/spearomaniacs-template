import { createClient } from "next-sanity";
import { sanityEnv } from "@/lib/sanity.env";

const token = process.env.SANITY_API_WRITE_TOKEN;

export const sanityWriteClient = token
  ? createClient({
      projectId: sanityEnv.projectId,
      dataset: sanityEnv.dataset,
      apiVersion: sanityEnv.apiVersion,
      useCdn: false,
      token,
      perspective: "published",
      stega: false,
    })
  : null;

export function hasSanityWriteAccess() {
  return Boolean(sanityEnv.isConfigured && token && sanityWriteClient);
}
