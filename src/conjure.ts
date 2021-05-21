import { BigInt, log } from "@graphprotocol/graph-ts"
import { Conjure, Issued, Burned} from "../generated/ConjureFactory/Conjure"
import { ConjureAsset, Statistics } from "../generated/schema"


export function handleTokenIssue(event: Issued): void {
    let conjureaddress = Conjure.bind(event.address)

    let asset = ConjureAsset.load(event.address.toHexString() + "-" + conjureaddress._collateralContract().toHexString())

    if (asset !== null) {
        asset.totalIssuedSynths = asset.totalIssuedSynths.plus(event.params.value)
        asset.save()
    }

    let statistic = Statistics.load("1")
    statistic.totalIssuedSynths = statistic.totalIssuedSynths.plus(event.params.value)
    statistic.save()
}

export function handleTokenBurn(event: Burned): void {
    let conjureaddress = Conjure.bind(event.address)

    let asset = ConjureAsset.load(event.address.toHexString() + "-" + conjureaddress._collateralContract().toHexString())

    if (asset !== null) {
        asset.totalIssuedSynths = asset.totalIssuedSynths.minus(event.params.value)
        asset.save()
    }

    let statistic = Statistics.load("1")
    statistic.totalIssuedSynths = statistic.totalIssuedSynths.minus(event.params.value)
    statistic.save()
}