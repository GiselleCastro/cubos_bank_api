import { Router } from 'express'
import { AuthMiddleware } from '../middlewares/authentication'
import { ValidateSchemaMiddleware } from '../middlewares/schemaValidation'
import { Params } from '../middlewares/schemaValidation'
import { CardsControllerFactory } from '../controllers/factories/cards.controller.factory'
import { paginationSchema } from '../schema'

export const router = Router()

const controller = CardsControllerFactory.make()

router.use(AuthMiddleware.handle())
router.get(
  '/',
  ValidateSchemaMiddleware.handle(paginationSchema, Params.QUERY),
  controller.listOfCards(),
)
