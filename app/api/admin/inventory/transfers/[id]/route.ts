import { NextResponse } from "next/server"
import { connectDB } from "@/lib/db"
import TransferRequest from "@/lib/models/transfer-request"
import Stock from "@/lib/models/stock"
import StoreLog from "@/lib/models/store-log"
import { validateSession } from "@/lib/auth"
import User from "@/lib/models/user"
import { addNotification } from "@/lib/notifications"

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await validateSession(request)
        if (user.role !== 'admin') {
            return NextResponse.json({ message: "Only admins can approve transfers" }, { status: 403 })
        }

        const { id } = await params
        const { action, denialReason } = await request.json()

        if (!['approved', 'denied'].includes(action)) {
            return NextResponse.json({ message: "Invalid action" }, { status: 400 })
        }

        await connectDB()

        const transferReq = await TransferRequest.findById(id)
        if (!transferReq) {
            return NextResponse.json({ message: "Transfer request not found" }, { status: 404 })
        }

        if (transferReq.status !== 'pending') {
            return NextResponse.json({ message: "Request already handled" }, { status: 400 })
        }

        if (action === 'denied') {
            transferReq.status = 'denied'
            transferReq.denialReason = denialReason
            transferReq.handledBy = user.id as any
            await transferReq.save()

            // Notify requester
            addNotification(
                "error",
                `Transfer Request for ${transferReq.quantity} units was denied. Reason: ${denialReason || 'No reason provided'}`,
                undefined,
                transferReq.requestedBy.toString()
            )

            return NextResponse.json(transferReq)
        }

        const stockItem = await (Stock as any).findById((transferReq as any).stockId)
        if (!stockItem) return NextResponse.json({ message: "Stock item not found" }, { status: 404 })

        if ((stockItem as any).storeQuantity < (transferReq as any).quantity) {
            return NextResponse.json({ message: `Insufficient store quantity. Current: ${(stockItem as any).storeQuantity}` }, { status: 400 })
        }

        ;(stockItem as any).storeQuantity -= (transferReq as any).quantity
        ;(stockItem as any).quantity += (transferReq as any).quantity
        await (stockItem as any).save()

        await (StoreLog as any).create({
            stockId: (transferReq as any).stockId,
            type: 'TRANSFER_OUT',
            quantity: (transferReq as any).quantity,
            unit: (stockItem as any).unit,
            user: user.id,
            notes: `Internal Transfer (Approved Request: ${(transferReq as any)._id}). ${(transferReq as any).notes || ''}`,
            date: new Date()
        })

        ;(transferReq as any).status = 'approved'
        ;(transferReq as any).handledBy = user.id as any
        await (transferReq as any).save()

        addNotification(
            "success",
            `Transfer Request for ${(transferReq as any).quantity} units of ${(stockItem as any).name} was approved!`,
            undefined,
            (transferReq as any).requestedBy?.toString?.() || (transferReq as any).requestedBy
        )

        return NextResponse.json(transferReq)

    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 500 })
    }
}
