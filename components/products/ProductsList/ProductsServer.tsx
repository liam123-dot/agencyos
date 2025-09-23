'use server'

import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { getProducts } from "@/app/api/products/productActions"
import CreateNewProduct from "../CreateNewProduct"
import { BaseProductsTable } from "../BaseProductsTable"

export async function ProductsServer() {
    const { organization } = await getOrg()

    if (!organization) {
        return <div>Organization not found</div>
    }

    const products = await getProducts()

    return (
        <BaseProductsTable
            products={products}
            title="Products"
            description={`Manage products and pricing for ${organization.name}.`}
            headerAction={<CreateNewProduct />}
            rowActionType="none"
        />
    )
}
