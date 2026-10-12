import { ComponentGallery } from "log-log-legends-kit";
import { GALLERY_N, galleryEdges, galleryNames } from "@/features/kit-page/toy-growth";

// The kit page's gallery: a sparse toy G(n, p) of 90 nodes, one tile per
// connected component, largest first (src/features/kit-page/toy-growth.ts).
export const SparseGraph = () => <ComponentGallery n={GALLERY_N} edges={galleryEdges} labels={galleryNames} max={11} />;
