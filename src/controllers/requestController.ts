import { Request, Response } from "express";
import * as requestService from "../services/requestService";
import { createRequestSchema, requestQuerySchema, updateRequestSchema } from "../validators/requestSchemas";

export async function createRequest(req: Request, res: Response) {
  const input = createRequestSchema.parse(req.body);
  const request = await requestService.createRequest(req.user!.id, req.user!.trustScore, input);
  res.status(201).json(request);
}

export async function getRequests(req: Request, res: Response) {
  const query = requestQuerySchema.parse(req.query);
  const requests = await requestService.getRequests(query);
  res.json(requests);
}

export async function updateRequest(req: Request, res: Response) {
  const input = updateRequestSchema.parse(req.body);
  const request = await requestService.updateRequest(String(req.params.id), req.user!.id, input);
  res.json(request);
}
