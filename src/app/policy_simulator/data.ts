import fs from 'fs';
import path from 'path';
const dataDir = path.join(process.cwd(), './data/sources');

export const youGovData = fs.readFileSync(
  path.join(dataDir, 'yougov_jan_2024.csv'),
  'utf-8'
);

export const census2021Data = {
  "Area Populations":
    fs.readFileSync(path.join(dataDir, 'area_populations.csv'), 'utf-8'),
  "Household Composition":
    fs.readFileSync(path.join(dataDir, 'household_composition.csv'), 'utf-8'),
  "Legal Partnership Status":
    fs.readFileSync(path.join(dataDir, 'legal_partnership_status.csv'), 'utf-8'),
  "Median Age":
    fs.readFileSync(path.join(dataDir, 'median_age.csv'), 'utf-8'),
  "Population by Age":
    fs.readFileSync(path.join(dataDir, 'population_by_age.csv'), 'utf-8'),
  "Population Densities":
    fs.readFileSync(path.join(dataDir, 'population_densities.csv'), 'utf-8')
};