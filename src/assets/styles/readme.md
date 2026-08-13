# CSS conventions

## Property order

Use this order when adding or reordering CSS/SCSS properties so styles are consistent and easier to scan.

1. **Display & flex layout**
   - `display`
   - `flex`, `flex-direction`, `flex-wrap`, `flex-grow`, `flex-shrink`, `flex-basis`
   - `align-items`, `justify-content`, `align-self`, `gap`

2. **Position**
   - `position`, `top`, `right`, `bottom`, `left`, `z-index`

3. **Dimensions**
   - `width`, `min-width`, `max-width`
   - `height`, `min-height`, `max-height`

4. **Spacing**
   - `margin`, `padding`

5. **Overflow**
   - `overflow`, `overflow-x`, `overflow-y`

6. **Typography & color**
   - `font-family`, `font-size`, `font-weight`, `font-style`, `letter-spacing`, `line-height`
   - `color`
   - `text-align`, `text-decoration`, `text-rendering`, `white-space`, `user-select`, `vertical-align`

7. **Background**
   - `background`, `background-color`, `background-image`, etc.

8. **Border**
   - `border`, `border-width`, `border-style`, `border-color`
   - `border-radius`

9. **Outline & box**
   - `outline`, `box-shadow`, `box-sizing`

10. **Visual effects**
    - `opacity`, `visibility`, `filter`, `transform`, `backface-visibility`

11. **Interaction**
    - `cursor`, `pointer-events`

12. **Transition & animation**
    - `transition`, `animation`

13. **Pseudo-elements**
    - `content` (and any other properties for `::before` / `::after`)

## Media queries

- **Placement:** put `@media` immediately after a selector’s base properties and **before** any nested child selectors.
- **Scope:** the block should only override that selector. Do not collect unrelated classes into one shared `@media` at the top of a parent.
- **Approach:** desktop-first defaults, then `max-width` overrides for smaller viewports.
- **Cascade:** base rules for a class must appear above its `@media` block.

```scss
// Good — media belongs to .panel, right under its base fields
.panel {
  display: grid;
  grid-template-columns: 1fr 320px;

  @media screen and (max-width: 1023px) {
    display: flex;
    flex-direction: column;
  }

  .panel-body {
    /* ... */
  }
}
```

Breakpoints (hardcoded — CSS variables cannot be used in `@media`):

- sm: `max-width: 559px`
- md: `max-width: 767px`
- lg: `max-width: 1023px`

## Component files

Styles for a component’s own class names belong in that component’s `<style lang="scss">` block (not scoped). Nest everything under the template’s primary class so styles cannot leak.

Parents wire layout (grid vs stack) but should not duplicate the child’s drawer, panel, or form styling.

Global tokens and shared primitives live in this folder and are imported from `index.scss`.
