import { Suspense } from "react";
import { ConnectDomainServer } from "./ConnectDomainServer";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export default function ConnectDomainComponent() {
    return (
        <Suspense fallback={<ConnectDomainSkeleton />}>
            <ConnectDomainServer />
        </Suspense>
    )
}

export function ConnectDomainSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-full" />
            </CardFooter>
        </Card>
    )
}

