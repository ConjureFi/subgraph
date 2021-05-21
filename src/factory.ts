import { BigInt, log } from "@graphprotocol/graph-ts"
import {
    NewConjure
} from "../generated/ConjureFactory/ConjureFactory"

import { Conjure} from "../generated/ConjureFactory/Conjure"
import { EtherCollateral} from "../generated/ConjureFactory/EtherCollateral"
import { ConjureAsset, Statistics } from "../generated/schema"
import { Conjure as cnj, EtherCollateral as ethcoll } from "../generated/templates"

export function handleNewConjure(event: NewConjure): void {
    let asset = ConjureAsset.load(event.params.conjure.toHexString() + "-" + event.params.etherCollateral.toHexString())
    if (asset === null) {
        asset = new ConjureAsset(event.params.conjure.toHexString() + "-" + event.params.etherCollateral.toHexString())
        let conjureaddress = Conjure.bind(event.params.conjure)
        let ethercollateraladdress = EtherCollateral.bind(event.params.etherCollateral)

        asset.address = event.params.conjure
        asset.collateralAddress = event.params.etherCollateral
        asset.name = conjureaddress.name()
        asset.symbol = conjureaddress.symbol()
        asset.deploymentPrice = conjureaddress._deploymentPrice()
        asset.lastPrice = conjureaddress.getLatestPrice()
        asset.lastPriceUpdate = conjureaddress.getLatestPriceTime()
        asset.created = event.block.timestamp
        asset.assetType = conjureaddress._assetType()
        asset.numOracles = conjureaddress._numoracles()

        asset.totalIssuedSynths = ethercollateraladdress.totalIssuedSynths()
        asset.collateralizationRatio = ethercollateraladdress.collateralizationRatio()
        asset.issueFeeRate = ethercollateraladdress.issueFeeRate()
        asset.totalLoansCreated = ethercollateraladdress.totalLoansCreated()
        asset.owner = ethercollateraladdress.owner()
        asset.totalCollateral = BigInt.fromI32(0)
        asset.totalOpenLoanCount = BigInt.fromI32(0)
        asset.save()
    }

    let statistic = Statistics.load("1")

    if(statistic === null) {
        statistic = new Statistics("1")
        statistic.totalSynthsCreated = BigInt.fromI32(1)
        statistic.totalLoansTaken = BigInt.fromI32(0)
        statistic.totalNetCollateral = BigInt.fromI32(0)
        statistic.totalLoansOpen = BigInt.fromI32(0)
        statistic.totalIssuedSynths = BigInt.fromI32(0)
        statistic.save()
    } else {
        statistic.totalSynthsCreated = statistic.totalSynthsCreated.plus(BigInt.fromI32(1))
        statistic.save()
    }

    cnj.create(event.params.conjure)
    ethcoll.create(event.params.etherCollateral)
}
