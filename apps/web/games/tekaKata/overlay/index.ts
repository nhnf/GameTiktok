import type { OverlayGameModule } from "../../overlayTypes";
import { tekaKataBanner } from "./banners";
import { SusunKataLayout } from "./SusunKataLayout";

export const tekaKataOverlay: OverlayGameModule = {
  Layout: SusunKataLayout,
  toBanner: tekaKataBanner,
};
