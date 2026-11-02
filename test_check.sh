#!/bin/bash
echo "Verifying fixes..."
grep -n "aria-label=\"Fechar modal\"" src/features/prospecting/outbound/components/ReportErrorButton.tsx
grep -n "aria-label=\"Fechar modal\"" src/features/prospecting/outbound/components/BrandGuideModal.tsx
grep -n "aria-label=\"Limpar busca\"" src/features/prospecting/outbound/components/SearchCombobox.tsx
grep -n "aria-label=\"Remover tag" src/features/prospecting/outbound/components/LeadStageAndTags.tsx
echo "All fixes are present."
