import type { OverlayGameModule } from "../../overlayTypes";
import { tebakKataBanner } from "./banners";
import { TebakKataLayout } from "./TebakKataLayout";

export const tebakKataOverlay: OverlayGameModule = {
  Layout: TebakKataLayout,
  toBanner: tebakKataBanner,
};
