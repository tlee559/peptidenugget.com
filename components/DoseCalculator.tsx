"use client";

import { useState } from "react";
import styles from "./DoseCalculator.module.css";

/**
 * Reconstitution maths is where the dangerous mistakes happen — a decimal
 * slip here is a 10x dose. So the calculator shows its working rather than
 * just printing a number.
 *
 * The whole thing rests on one fact: a U-100 insulin syringe holds 1 mL, and
 * that 1 mL is marked as 100 "units". So 1 unit = 0.01 mL.
 */
export default function DoseCalculator() {
  const [mg, setMg] = useState("5");
  const [ml, setMl] = useState("2");
  const [dose, setDose] = useState("250");

  const mgN = parseFloat(mg), mlN = parseFloat(ml), doseN = parseFloat(dose);
  const valid = mgN > 0 && mlN > 0 && doseN > 0;

  // mcg in the vial / units of water = mcg per unit
  const mcgPerMl = valid ? (mgN * 1000) / mlN : 0;
  const mcgPerUnit = mcgPerMl / 100;
  const units = valid ? doseN / mcgPerUnit : 0;
  const dosesPerVial = valid ? Math.floor((mgN * 1000) / doseN) : 0;
  const overfill = units > 100;

  return (
    <div className={styles.calc}>
      <h3 className={styles.h}>Dose calculator</h3>
      <p className={styles.sub}>
        Type in your numbers. It works out how far to pull the plunger on a
        standard U-100 insulin syringe.
      </p>

      <div className={styles.grid}>
        <label>
          <span>Powder in the vial</span>
          <div className={styles.field}>
            <input inputMode="decimal" value={mg} onChange={(e) => setMg(e.target.value)} />
            <em>mg</em>
          </div>
        </label>
        <label>
          <span>Water you added</span>
          <div className={styles.field}>
            <input inputMode="decimal" value={ml} onChange={(e) => setMl(e.target.value)} />
            <em>mL</em>
          </div>
        </label>
        <label>
          <span>Dose you want</span>
          <div className={styles.field}>
            <input inputMode="decimal" value={dose} onChange={(e) => setDose(e.target.value)} />
            <em>mcg</em>
          </div>
        </label>
      </div>

      {!valid ? (
        <p className={styles.warn}>Enter a number bigger than zero in all three boxes.</p>
      ) : (
        <>
          <div className={styles.answer}>
            <span className={styles.big}>{units.toFixed(1)}</span>
            <span className={styles.unitLabel}>
              units on the syringe
              <br />
              <small>({(units / 100).toFixed(3)} mL)</small>
            </span>
          </div>

          {overfill && (
            <p className={styles.warn}>
              That is more than a whole 1&nbsp;mL syringe holds. Add more water, or
              draw more than one syringe.
            </p>
          )}

          <table className={styles.work}>
            <tbody>
              <tr>
                <td>Strength of your mix</td>
                <td>
                  {mgN} mg ÷ {mlN} mL = <b>{(mgN / mlN).toFixed(2)} mg/mL</b>
                </td>
              </tr>
              <tr>
                <td>In each syringe unit</td>
                <td>
                  {mcgPerMl.toFixed(0)} mcg/mL ÷ 100 = <b>{mcgPerUnit.toFixed(1)} mcg</b> per unit
                </td>
              </tr>
              <tr>
                <td>For a {doseN} mcg dose</td>
                <td>
                  {doseN} ÷ {mcgPerUnit.toFixed(1)} = <b>{units.toFixed(1)} units</b>
                </td>
              </tr>
              <tr>
                <td>Doses in the vial</td>
                <td>
                  about <b>{dosesPerVial}</b>
                </td>
              </tr>
            </tbody>
          </table>

          <p className={styles.note}>
            Adding more water does <b>not</b> change how much powder is in the vial.
            It only spreads it out, so each unit holds less. Same total either way.
          </p>
        </>
      )}
    </div>
  );
}
