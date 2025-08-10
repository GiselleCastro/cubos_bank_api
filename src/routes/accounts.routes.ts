import { Router } from 'express'
import { AuthMiddleware } from '../middlewares/authentication'
import { ValidateSchemaMiddleware } from '../middlewares/schemaValidation'
import { Params } from '../middlewares/schemaValidation'
import { AccountsControllerFactory } from '../controllers/factories/accounts.controller.factory'
import { createAccountBodySchema, idAccountParamsSchema } from '../schema/accounts'
import { createCardBodySchema } from '../schema/accounts'
import { TransactionsControllerFactory } from '../controllers/factories/transactions.controller.factory'
import {
  createTransactionBodySchema,
  createInternalTransferBodySchema,
  idTransactionParamsSchema,
  transactionPaginationSchema,
} from '../schema/transactions'

export const router = Router()

const controllerTransactions = TransactionsControllerFactory.make()

const controllerAccounts = AccountsControllerFactory.make()

router.use(AuthMiddleware.handle())
router.post(
  '/',
  ValidateSchemaMiddleware.handle(createAccountBodySchema),
  controllerAccounts.createAccount(),
)
router.get('/', controllerAccounts.listOfAccounts())
router.post(
  '/:accountId/cards',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  ValidateSchemaMiddleware.handle(createCardBodySchema),
  controllerAccounts.createCard(),
)
router.get(
  '/:accountId/cards',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  controllerAccounts.listOfCardsByAccount(),
)
router.get(
  '/:accountId/balance',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  controllerAccounts.checkBalance(),
)
router.post(
  '/:accountId/transactions/',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  ValidateSchemaMiddleware.handle(createTransactionBodySchema),
  controllerTransactions.createTransaction(),
)
router.get(
  '/:accountId/transactions/',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  ValidateSchemaMiddleware.handle(transactionPaginationSchema, Params.QUERY),
  controllerTransactions.listOfAllTransactions(),
)
router.post(
  '/:accountId/transactions/internal',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  ValidateSchemaMiddleware.handle(createInternalTransferBodySchema),
  controllerTransactions.createInternalTransfer(),
)
router.post(
  '/:accountId/transactions/:transactionId/revert',
  ValidateSchemaMiddleware.handle(idAccountParamsSchema, Params.PARAMS),
  ValidateSchemaMiddleware.handle(idTransactionParamsSchema, Params.PARAMS),
  controllerTransactions.reverseTransaction(),
)
