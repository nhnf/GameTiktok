import type { OverlayGameModule } from "../../overlayTypes";
import { matematikaBanner } from "./banners";
import { MatematikaLayout } from "./MatematikaLayout";

export const matematikaOverlay: OverlayGameModule = {
  Layout: MatematikaLayout,
  toBanner: matematikaBanner,
};
