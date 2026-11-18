import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { PageSkeleton, type PageSkeletonVariant } from "../components/LoadingSkeleton";

export function lazyRoute<K extends string>(
  loader: () => Promise<Record<K, ComponentType>>,
  exportName: K,
  variant: PageSkeletonVariant,
): ReactNode {
  const LazyComponent = lazy<ComponentType>(async () => {
    const mod = await loader();
    return { default: mod[exportName] };
  });

  return (
    <Suspense fallback={<PageSkeleton variant={variant} />}>
      <LazyComponent />
    </Suspense>
  );
}
