import { Router } from 'express'
import { ValidateSchemaMiddleware } from '../middlewares/schemaValidation'
import { UsersControllerFactory } from '../controllers/factories/users.controller.factory'
import { createUserBodySchema, loginBodySchema } from '../schema/users'

export const router = Router()

const controller = UsersControllerFactory.make()

router.post(
  '/people',
  ValidateSchemaMiddleware.handle(createUserBodySchema),
  controller.registerUser(),
)
router.post(
  '/login',
  ValidateSchemaMiddleware.handle(loginBodySchema),
  controller.login(),
)
