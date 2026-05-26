import { Request, Response } from "express";
import * as personService from "../services/personService";
import { personQuerySchema } from "../validators/personSchemas";

export async function getPersons(req: Request, res: Response) {
  const query = personQuerySchema.parse(req.query);
  const persons = await personService.getPublicPersons(query);
  res.json(persons);
}

export async function getPerson(req: Request, res: Response) {
  const person = await personService.getPersonById(String(req.params.id), req.user?.role === "ADMIN");
  res.json(person);
}
