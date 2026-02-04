export default function DashboardLoading() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="h-10 w-64 bg-muted/20 rounded-lg animate-pulse" />

            {/* Stats Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-40 bg-muted/20 rounded-xl animate-pulse border border-border" />
                ))}
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-64 bg-muted/20 rounded-xl animate-pulse border border-border" />
                <div className="h-64 bg-muted/20 rounded-xl animate-pulse border border-border" />
            </div>
        </div>
    );
}
