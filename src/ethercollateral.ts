import { BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { Conjure} from "../generated/templates/Conjure/Conjure"
import { LoanCreated, LoanClosed, EtherCollateral, CollateralWithdrawn, CollateralDeposited, LoanRepaid} from "../generated/templates/EtherCollateral/EtherCollateral"
import { ConjureAsset, Statistic, Loan } from "../generated/schema"


export function handleLoanCreated(event: LoanCreated): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)
    let conjureassetAddress = Conjure.bind(ethercollateraladdress.arbasset())

    let asset = ConjureAsset.load(ethercollateraladdress.arbasset().toHexString() + "-" + event.address.toHexString())

    if (asset !== null) {
        asset.totalOpenLoanCount = asset.totalOpenLoanCount.plus(BigInt.fromI32(1))
        asset.totalLoansCreated = asset.totalLoansCreated.plus(BigInt.fromI32(1))
        asset.totalIssuedSynths = asset.totalIssuedSynths.plus(event.params.amount)
        asset.totalCollateral = asset.totalCollateral.plus(ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1)
        asset.lastPrice = conjureassetAddress.getLatestPrice()
        asset.lastPriceUpdate = conjureassetAddress.getLatestPriceTime()
        asset.save()
    }

    // loan entry
    let loan = new Loan( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.loanID = event.params.loanID
    loan.borrower = event.params.account
    loan.collateralAddress = event.address
    loan.assetAddress = ethercollateraladdress.arbasset()
    loan.loanAmount = event.params.amount
    loan.symbol = conjureassetAddress.symbol()
    loan.collateralAmount = ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1

    let callResult = ethercollateraladdress.try_getLoanCollateralRatio(event.params.account,event.params.loanID)
    if (callResult.reverted) {
        log.info("getLoan reverted", [])
        loan.cRatio = BigInt.fromI32(1)
    } else {
        loan.cRatio = callResult.value
    }

    loan.loanOpen = true
    loan.save()

    let statistic = Statistic.load("1")
    statistic.totalLoansTaken = statistic.totalLoansTaken.plus(BigInt.fromI32(1))
    statistic.totalLoansOpen = statistic.totalLoansOpen.plus(BigInt.fromI32(1))
    statistic.totalNetCollateral = statistic.totalNetCollateral.plus(ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1)
    statistic.save()
}


export function handleLoanClosed(event: LoanClosed): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)

    let asset = ConjureAsset.load(ethercollateraladdress.arbasset().toHexString() + "-" + event.address.toHexString())

    if (asset !== null) {
        asset.totalOpenLoanCount = asset.totalOpenLoanCount.minus(BigInt.fromI32(1))
        asset.totalCollateral = asset.totalCollateral.minus(ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1)
        asset.save()
    }

    // loan entry
    let loan = Loan.load( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.collateralAmount = ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1
    loan.cRatio = BigInt.fromI32(1)
    loan.loanOpen = false
    loan.save()

    let statistic = Statistic.load("1")
    statistic.totalLoansOpen = statistic.totalLoansOpen.minus(BigInt.fromI32(1))
    statistic.totalNetCollateral = statistic.totalNetCollateral.minus(ethercollateraladdress.getLoan(event.params.account,event.params.loanID).value1)
    statistic.save()
}

export function handleCollateralDeposited(event: CollateralDeposited): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)

    let asset = ConjureAsset.load(ethercollateraladdress.arbasset().toHexString() + "-" + event.address.toHexString())
    asset.totalCollateral = asset.totalCollateral.plus(event.params.collateralAmount)
    asset.save()

    // loan entry
    let loan = Loan.load( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.collateralAmount = event.params.collateralAfter

    let callResult = ethercollateraladdress.try_getLoanCollateralRatio(event.params.account,event.params.loanID)
    if (callResult.reverted) {
        log.info("getLoan reverted dep", [])
        loan.cRatio = BigInt.fromI32(1)
    } else {
        loan.cRatio = callResult.value
    }

    loan.save()

    let statistic = Statistic.load("1")
    statistic.totalNetCollateral = statistic.totalNetCollateral.plus(event.params.collateralAmount)
    statistic.save()
}

export function handleCollateralWithdrawn(event: CollateralWithdrawn): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)

    let asset = ConjureAsset.load(ethercollateraladdress.arbasset().toHexString() + "-" + event.address.toHexString())
    asset.totalCollateral = asset.totalCollateral.minus(event.params.amountWithdrawn)
    asset.save()

    // loan entry
    let loan = Loan.load( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.collateralAmount = event.params.collateralAfter

    let callResult = ethercollateraladdress.try_getLoanCollateralRatio(event.params.account,event.params.loanID)
    if (callResult.reverted) {
        log.info("getLoan reverted with", [])
        loan.cRatio = BigInt.fromI32(1)
    } else {
        loan.cRatio = callResult.value
    }

    loan.save()

    let statistic = Statistic.load("1")
    statistic.totalNetCollateral = statistic.totalNetCollateral.minus(event.params.amountWithdrawn)
    statistic.save()
}

export function handleLoanRepaid(event: LoanRepaid): void {
    let ethercollateraladdress = EtherCollateral.bind(event.address)
    // loan entry
    let loan = Loan.load( event.address.toHexString() + "-" + event.params.account.toHexString() + "-" + event.params.loanID.toHexString())
    loan.loanAmount = event.params.newLoanAmount

    let callResult = ethercollateraladdress.try_getLoanCollateralRatio(event.params.account,event.params.loanID)
    if (callResult.reverted) {
        log.info("getLoan reverted repay", [])
        loan.cRatio = BigInt.fromI32(1)
    } else {
        loan.cRatio = callResult.value
    }
    loan.save()
}