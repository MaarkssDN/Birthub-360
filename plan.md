1. **Target**: Add `aria-label` to the `BrandOrb` component in `src/components/ui/BrandOrb.tsx`.
   - The `<button>` in `BrandOrb` lacks an `aria-label`. The `title` attribute is present but an `aria-label` improves screen reader support, especially since the button contains a 3D canvas object which screen readers can't interpret.
2. **Implementation**:
   - Update `src/components/ui/BrandOrb.tsx`.
   - Add `aria-label={interactive ? 'Interagir com o Brand Orb' : 'Brand Orb'}` to the `<button>` element.
3. **Pre-commit**: Complete pre-commit instructions.
4. **Submit**: Create PR.
