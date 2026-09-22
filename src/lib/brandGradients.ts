/**
 * Brand gradient utilities (ZER-120).
 *
 * SSOT for *gradient ramps*: Figma web / landing `grad-primary` + `grad-warm`
 * (shipped in nodo-serrano-landing/app/globals.css).
 *
 * SSOT for *solid* brand fills (chips, TabBar active, primary solid): Pencil
 * `design/nodo-serrano.pen` — keep `brand-mint` / `brand-green` / `brand-blue` /
 * `brand-violet` as the darker solids. Do not rename those tokens to the light
 * gradient stops (landing calls light mint `brand-mint`; app keeps that hex as
 * `mint-raw`).
 *
 * Naming map (app ↔ landing):
 * | App token        | Hex       | Landing equivalent              |
 * |------------------|-----------|---------------------------------|
 * | brand-mint       | #0a8268   | accent-teal                     |
 * | brand-green/primary | #0c8a5e | (app solid CTA legacy / Pencil) |
 * | brand-blue       | #1158b0   | logo-blue                       |
 * | brand-violet     | #6b3fa8   | logo-violet                     |
 * | mint-raw         | #4fe6c3   | brand-mint (grad stop)          |
 * | blue-raw         | #2e9bff   | brand-blue (grad stop)          |
 * | violet-raw       | #b57fe0   | accent-violet (chip wash)       |
 * | grad-violet      | #c87fe5   | brand-violet (grad stop)        |
 * | warm-orange      | #ff4d21   | accent-orange                   |
 * | warm-red         | #ff3121   | warm-red (grad-warm mid)        |
 */

/** Tailwind class from globals.css @utility bg-gradient-brand */
export const BRAND_GRADIENT_CLASS = "bg-gradient-brand";

/** Tailwind class from globals.css @utility bg-gradient-warm */
export const WARM_GRADIENT_CLASS = "bg-gradient-warm";

/** Cool CTA outer shadow aligned with landing shadow-btn-cool family */
export const BRAND_CTA_SHADOW_CLASS = "shadow-[0_4px_14px_rgba(46,155,255,0.40)]";
