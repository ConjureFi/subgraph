import { BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { Conjure} from "../generated/ConjureFactory/Conjure"
import { LoanCreated, LoanClosed, EtherCollateral} from "../generated/templates/EtherCollateral/EtherCollateral"
import { ConjureAsset, Statistics, Loans } from "../generated/schema"


export function handleLoanCreated(event: LoanCreated): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)

    let asset = ConjureAsset.load(ethercollateraladdress.arbasset().toHexString() + "-" + event.address.toHexString())

    if (asset !== null) {
        asset.totalOpenLoanCount = asset.totalOpenLoanCount.plus(BigInt.fromI32(1))
        asset.totalLoansCreated = asset.totalLoansCreated.plus(BigInt.fromI32(1))
        asset.save()
    }

    let statistic = Statistics.load("1")
    statistic.totalLoansTaken = statistic.totalLoansTaken.plus(BigInt.fromI32(1))
    statistic.totalLoansOpen = statistic.totalLoansOpen.plus(BigInt.fromI32(1))
    statistic.save()

    // loan entry
    let loan = new Loans( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.loanID = event.params.loanID
    loan.borrower = event.params.account
    loan.collateralAddress = event.address
    loan.assetAddress = ethercollateraladdress.arbasset()
    loan.loanAmount = event.params.amount
    loan.collateralAmount = ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1
    loan.cRatio = BigInt.fromI32(1)
    loan.loanOpen = true
    loan.save()
}


export function handleLoanClosed(event: LoanClosed): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)

    let asset = ConjureAsset.load(ethercollateraladdress.arbasset().toHexString() + "-" + event.address.toHexString())

    if (asset !== null) {
        asset.totalOpenLoanCount = asset.totalOpenLoanCount.minus(BigInt.fromI32(1))
        asset.save()
    }

    let statistic = Statistics.load("1")
    statistic.totalLoansOpen = statistic.totalLoansOpen.minus(BigInt.fromI32(1))
    statistic.save()

    // loan entry
    let loan = Loans.load( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.collateralAmount = ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1
    loan.cRatio = BigInt.fromI32(1)
    loan.loanOpen = false
    loan.save()
}