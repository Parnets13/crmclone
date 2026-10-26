// Fallback salary processing without Redis
import Employee from "../models/Employee.js";
import SalarySlip from "../models/SalarySlip.js";
import Attendance from "../models/Attendance.js";
import { generateSalaryPDF } from "../utils/pdfGenerator.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Direct salary calculation without queue
export const generateSalarySlipDirect = async (
  employeeId,
  month,
  year,
  generatedBy,
  type = "manual"
) => {
  try {
    console.log(
      `Processing salary for employee ${employeeId}, ${month}/${year} (${type})`
    );

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new Error("Employee not found");
    }

    // Check if salary slip already exists
    const existingSlip = await SalarySlip.findOne({
      employeeId,
      month,
      year,
    });

    if (existingSlip) {
      console.log(
        `Salary slip already exists for ${employee.name} - ${month}/${year}`
      );
      return {
        success: false,
        message: "Salary slip already exists",
        employeeName: employee.name,
      };
    }

    // Calculate salary period (1st to last day of month)
    const periodFrom = new Date(year, month - 1, 1);
    const periodTo = new Date(year, month, 0); // Last day of month

    // Get attendance for the month
    const attendance = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: periodFrom,
        $lte: periodTo,
      },
    });

    // Calculate working days (excluding weekends)
    let workingDays = 0;
    let presentDays = 0;
    let leaveDays = 0;
    let currentDate = new Date(periodFrom);

    while (currentDate <= periodTo) {
      const dayOfWeek = currentDate.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;

        // Check if employee was present on this day
        const attendanceRecord = attendance.find(
          (a) => a.date.toDateString() === currentDate.toDateString()
        );

        if (attendanceRecord) {
          if (
            attendanceRecord.status === "Present" ||
            attendanceRecord.status === "Late"
          ) {
            presentDays++;
          } else if (attendanceRecord.status === "Leave") {
            leaveDays++;
            presentDays++; // Count leave as present for salary calculation
          }
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const absentDays = workingDays - presentDays;

    // Calculate salary based on salary type
    let calculatedBasic = 0;
    let calculatedHRA = 0;
    let calculatedConveyance = 0;
    let calculatedMedical = 0;
    let calculatedSpecial = 0;
    let calculatedPF = 0;
    let calculatedTDS = 0;
    let grossSalary = 0;
    let netSalary = 0;

    if (employee.salaryType === "fixed") {
      // For fixed salary, use the stored salary components
      calculatedBasic = employee.basicSalary;
      calculatedHRA = employee.hra || 0;
      calculatedConveyance = employee.conveyance || 0;
      calculatedMedical = employee.medicalAllowance || 0;
      calculatedSpecial = employee.specialAllowance || 0;
      calculatedPF = employee.pf || 0;
      calculatedTDS = employee.tds || 0;

      grossSalary =
        calculatedBasic +
        calculatedHRA +
        calculatedConveyance +
        calculatedMedical +
        calculatedSpecial;
    } else if (employee.salaryType === "daily") {
      // For daily wage
      const dailyRate = employee.basicSalary;
      calculatedBasic = dailyRate * presentDays;

      grossSalary = calculatedBasic;
      calculatedPF = grossSalary * 0.12; // 12% PF
      calculatedTDS = grossSalary > 50000 ? grossSalary * 0.05 : 0; // 5% TDS if salary > 50k
    } else if (employee.salaryType === "hourly") {
      // For hourly wage - calculate total hours worked
      const totalHours = attendance.reduce((total, record) => {
        if (
          (record.status === "Present" || record.status === "Late") &&
          record.punchIn &&
          record.punchOut
        ) {
          const hoursWorked =
            (new Date(record.punchOut.time) - new Date(record.punchIn.time)) /
            (1000 * 60 * 60);
          return total + Math.max(0, hoursWorked);
        }
        return total;
      }, 0);

      const hourlyRate = employee.basicSalary;
      calculatedBasic = hourlyRate * totalHours;
      grossSalary = calculatedBasic;

      calculatedPF = grossSalary * 0.12;
      calculatedTDS = grossSalary > 50000 ? grossSalary * 0.05 : 0;
    }

    const totalDeductions =
      calculatedPF +
      (employee.professionalTax || 0) +
      calculatedTDS +
      (employee.otherDeductions || 0);
    netSalary = grossSalary - totalDeductions;

    // Create salary slip
    const salaryData = {
      employeeId,
      employee: {
        name: employee.name,
        empId: employee.empId,
        designation: employee.designation,
        department: employee.department,
      },
      month,
      year,
      basicSalary: calculatedBasic,
      hra: calculatedHRA,
      conveyance: calculatedConveyance,
      medicalAllowance: calculatedMedical,
      specialAllowance: calculatedSpecial,
      pf: calculatedPF,
      professionalTax: employee.professionalTax || 0,
      tds: calculatedTDS,
      otherDeductions: employee.otherDeductions || 0,
      grossSalary,
      totalDeductions,
      netSalary,
      workingDays,
      daysWorked: presentDays,
      hoursWorked: attendance.reduce((total, record) => {
        if (
          (record.status === "Present" || record.status === "Late") &&
          record.punchIn &&
          record.punchOut
        ) {
          const hoursWorked =
            (new Date(record.punchOut.time) - new Date(record.punchIn.time)) /
            (1000 * 60 * 60);
          return total + Math.max(0, hoursWorked);
        }
        return total;
      }, 0),
      salaryType: employee.salaryType,
      bankDetails: {
        bankName: employee.bankName,
        accountNumber: employee.accountNumber,
        ifscCode: employee.ifscCode,
      },
      status: "generated",
      generatedBy,
      generationType: type,
    };

    const salary = new SalarySlip(salaryData);
    await salary.save();

    console.log(`Salary generated successfully for ${employee.name}`);

    return {
      success: true,
      salaryId: salary._id,
      employeeName: employee.name,
      netSalary,
      type,
    };
  } catch (error) {
    console.error(`Error generating salary for employee ${employeeId}:`, error);
    throw error;
  }
};

// Fallback functions for when Redis is not available
export const addSalaryJob = async (
  employeeId,
  month,
  year,
  generatedBy,
  type = "manual"
) => {
  // Process directly without queue
  return await generateSalarySlipDirect(
    employeeId,
    month,
    year,
    generatedBy,
    type
  );
};

export const addBulkSalaryJobs = async (
  month,
  year,
  generatedBy,
  type = "manual"
) => {
  try {
    const employees = await Employee.find({ status: "Active" });
    const results = [];

    for (const employee of employees) {
      try {
        const result = await generateSalarySlipDirect(
          employee._id,
          month,
          year,
          generatedBy,
          type
        );
        results.push(result);
      } catch (error) {
        console.error(
          `Failed to generate salary for ${employee.name}:`,
          error.message
        );
        results.push({
          success: false,
          employeeName: employee.name,
          error: error.message,
        });
      }
    }

    console.log(
      `Processed ${results.length} salary slips for ${month}/${year}`
    );
    return results;
  } catch (error) {
    console.error("Error adding bulk salary jobs:", error);
    throw error;
  }
};

export const getQueueStatus = async () => {
  return {
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    jobs: {
      waiting: [],
      active: [],
      failed: [],
    },
    mode: "direct",
    message: "Processing salary slips directly (Redis not available)",
  };
};

// Export null values for compatibility
export const salaryQueue = null;
export const salaryWorker = null;
