'use server';

import { NewContractData, Contract } from './types';
import fs from 'fs/promises';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'contracts.json');
const TS_PATH = path.join(process.cwd(), 'data', 'timesheets.json');

async function ensureDb(filePath = DB_PATH) {
    try {
        await fs.access(filePath);
    } catch {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
    }
}

export async function saveContract(data: NewContractData): Promise<{ success: boolean; message?: string }> {
    await ensureDb(DB_PATH);

    try {
        const fileContent = await fs.readFile(DB_PATH, 'utf-8');
        const contracts: Contract[] = JSON.parse(fileContent);

        const newContract: Contract = {
            ...data,
            id: crypto.randomUUID(),
            employeeId: crypto.randomUUID(), // In a real app, this would link to an existing user
            status: 'Active', // Auto-activate for now
            startDate: new Date().toISOString().split('T')[0],
        };

        contracts.push(newContract);
        await fs.writeFile(DB_PATH, JSON.stringify(contracts, null, 2));

        return { success: true };
    } catch (error) {
        console.error('Failed to save contract:', error);
        return { success: false, message: 'Database error' };
    }
}

export async function getContracts(): Promise<Contract[]> {
    await ensureDb(DB_PATH);
    try {
        const fileContent = await fs.readFile(DB_PATH, 'utf-8');
        return JSON.parse(fileContent);
    } catch {
        return [];
    }
}

export async function saveTimesheet(data: any): Promise<{ success: boolean; message?: string }> {
    await ensureDb(TS_PATH);
    try {
        const fileContent = await fs.readFile(TS_PATH, 'utf-8');
        const timesheets = JSON.parse(fileContent);

        const newTs = {
            ...data,
            id: crypto.randomUUID(),
            status: 'Pending',
            submittedAt: new Date().toISOString(),
        };

        timesheets.push(newTs);
        await fs.writeFile(TS_PATH, JSON.stringify(timesheets, null, 2));
        return { success: true };
    } catch (error) {
        console.error('Failed to save timesheet:', error);
        return { success: false, message: 'Database error' };
    }
}

export async function getTimesheets(employeeId?: string): Promise<any[]> {
    await ensureDb(TS_PATH);
    try {
        const fileContent = await fs.readFile(TS_PATH, 'utf-8');
        const ts = JSON.parse(fileContent);
        if (employeeId) {
            return ts.filter((t: any) => t.employeeId === employeeId);
        }
        return ts;
    } catch {
        return [];
    }
}

export async function approveTimesheet(id: string): Promise<{ success: boolean }> {
    await ensureDb(TS_PATH);
    try {
        const fileContent = await fs.readFile(TS_PATH, 'utf-8');
        let timesheets = JSON.parse(fileContent);
        timesheets = timesheets.map((t: any) => t.id === id ? { ...t, status: 'Approved' } : t);
        await fs.writeFile(TS_PATH, JSON.stringify(timesheets, null, 2));
        return { success: true };
    } catch {
        return { success: false };
    }
}
