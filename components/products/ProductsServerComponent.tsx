'use server'

import { ProductsServer } from "./ProductsList"

export default async function ProductsServerComponent() {
    return (
        <div className="space-y-6">
            <ProductsServer/>
        </div>
    )
}
