import { Request, Response } from "express";
import * as tagService from "../services/tagService";
import { addTagSchema } from "../validators/tagSchemas";

export async function addTagToPerson(req: Request, res: Response) {
  const input = addTagSchema.parse(req.body);
  const personTag = await tagService.addTagToPerson(String(req.params.id), input);
  res.status(201).json(personTag);
}
