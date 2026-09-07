import { Request, Response } from "express";
import * as personService from "../services/personService";
import { acceptWebSearchSchema, personQuerySchema, previewWebSearchSchema } from "../validators/personSchemas";

export async function getPersons(req: Request, res: Response) {
  const query = personQuerySchema.parse(req.query);
  const persons = await personService.getPublicPersons(query);
  res.json(persons);
}

export async function getPerson(req: Request, res: Response) {
  const person = await personService.getPersonById(String(req.params.id), req.user?.role === "ADMIN");
  res.json(person);
}

export async function generateAiOverview(req: Request, res: Response) {
  const overview = await personService.generatePersonAiOverview(String(req.params.id));
  res.json({ overview });
}

export async function previewWebSearch(req: Request, res: Response) {
  const input = previewWebSearchSchema.parse(req.body ?? {});
  const findings = await personService.previewWebSearch(String(req.params.id), input);
  res.json(findings);
}

export async function acceptWebSearch(req: Request, res: Response) {
  const input = acceptWebSearchSchema.parse(req.body);
  const result = await personService.acceptWebSearchFindings(
    String(req.params.id),
    input.results,
    input.summary
  );
  res.json(result);
}
