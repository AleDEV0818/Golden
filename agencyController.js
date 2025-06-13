import { pool } from "../config/dbConfig.js";


const typeMap = {
  1: "Corporate",
  2: "Franchise",
  4: "Independent Agent"
};

export const agency = async (req, res) => {
  try {
    const date = new Date();
    const initial_date = new Date(date.getFullYear(), date.getMonth(), 1);
    const final_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    const defaultPanel = {
      nb_prem: '$0.00', nb_pol: 0,
      rn_prem: '$0.00', rn_pol: 0,
      rw_prem: '$0.00', rw_pol: 0,
      tot_prem: '$0.00', tot_pol: 0
    };

    let panelToday = { ...defaultPanel };
    let panelMonth = { ...defaultPanel };
    let panelCompanyToday = { ...defaultPanel };
    let panelCompanyMonth = { ...defaultPanel };
    let agency_name = "Agency";
    let location_type = 1; 

    
    if (req.user) {
      const userId = req.user.user_id || req.user.id;
      const userQuery = `
        SELECT u.user_id, u.display_name, u.job_title, u.location_id, l.location_type, l.alias, lt.location_type as location_type_name
        FROM entra.users u
        JOIN qq.locations l ON u.location_id = l.location_id
        JOIN admin.location_types lt ON l.location_type = lt.location_type_id
        WHERE u.user_id = $1
      `;
      const { rows: userRows } = await pool.query(userQuery, [userId]);
      if (userRows.length) {
        const user = userRows[0];
        location_type = user.location_type;

        if (user.location_type !== 1) {
          agency_name = user.alias;
          // --- PRODUCCIÓN DIARIA DE LA AGENCIA ---
          let production = (await pool.query(
            `SELECT * FROM intranet.dashboard_location_daily($1)`, [user.location_id]
          )).rows;
          if (production.length) {
            panelToday = {
              nb_prem: production[0]?.premium ? production[0].premium.slice(0, -3) : '$0',
              nb_pol: production[0]?.policies || 0,
              rn_prem: production[1]?.premium ? production[1].premium.slice(0, -3) : '$0',
              rn_pol: production[1]?.policies || 0,
              rw_prem: production[2]?.premium ? production[2].premium.slice(0, -3) : '$0',
              rw_pol: production[2]?.policies || 0,
              tot_prem: production[3]?.premium ? production[3].premium.slice(0, -3) : '$0',
              tot_pol: production[3]?.policies || 0,
            };
          }
          // --- PRODUCCIÓN MENSUAL DE LA AGENCIA ---
          production = (await pool.query(
            `SELECT * FROM intranet.dashboard_location_month($1, $2, $3)`,
            [initial_date, final_date, user.location_id]
          )).rows;
          if (production.length) {
            panelMonth = {
              nb_prem: production[0]?.premium ? production[0].premium.slice(0, -3) : '$0.00',
              nb_pol: production[0]?.policies || 0,
              rn_prem: production[1]?.premium ? production[1].premium.slice(0, -3) : '$0.00',
              rn_pol: production[1]?.policies || 0,
              rw_prem: production[2]?.premium ? production[2].premium.slice(0, -3) : '$0.00',
              rw_pol: production[2]?.policies || 0,
              tot_prem: production[3]?.premium ? production[3].premium.slice(0, -3) : '$0.00',
              tot_pol: production[3]?.policies || 0,
            };
          }
        } else {
          agency_name = "Corporate";
          // --- CORPORATE TODAY ---
          let corporateTodayRows = (await pool.query('SELECT * FROM intranet.corporate_today')).rows;
          if (corporateTodayRows.length) {
            panelToday = {
              nb_prem: corporateTodayRows[0]?.premium ? corporateTodayRows[0].premium.toString() : '$0',
              nb_pol: corporateTodayRows[0]?.policies || 0,
              rn_prem: corporateTodayRows[1]?.premium ? corporateTodayRows[1].premium.toString() : '$0',
              rn_pol: corporateTodayRows[1]?.policies || 0,
              rw_prem: corporateTodayRows[2]?.premium ? corporateTodayRows[2].premium.toString() : '$0',
              rw_pol: corporateTodayRows[2]?.policies || 0,
              tot_prem: corporateTodayRows[3]?.premium ? corporateTodayRows[3].premium.toString() : '$0',
              tot_pol: corporateTodayRows[3]?.policies || 0,
            };
          }
          // --- CORPORATE MONTH ---
          let corporateMonthRows = (await pool.query('SELECT * FROM intranet.corporate_month')).rows;
          if (corporateMonthRows.length) {
            panelMonth = {
              nb_prem: corporateMonthRows[0]?.premium ? corporateMonthRows[0].premium.toString() : '$0.00',
              nb_pol: corporateMonthRows[0]?.policies || 0,
              rn_prem: corporateMonthRows[1]?.premium ? corporateMonthRows[1].premium.toString() : '$0.00',
              rn_pol: corporateMonthRows[1]?.policies || 0,
              rw_prem: corporateMonthRows[2]?.premium ? corporateMonthRows[2].premium.toString() : '$0.00',
              rw_pol: corporateMonthRows[2]?.policies || 0,
              tot_prem: corporateMonthRows[3]?.premium ? corporateMonthRows[3].premium.toString() : '$0.00',
              tot_pol: corporateMonthRows[3]?.policies || 0,
            };
          }
        }
      }
    }
    // --- PRODUCCIÓN DE LA COMPAÑÍA  ---
    let companyTodayRows = (await pool.query(`SELECT * FROM intranet.dashboard_company_today`)).rows;
    let companyMonthRows = (await pool.query(
      `SELECT * FROM intranet.dashboard_sales_month_total_by_type_tkg($1, $2)`,
      [initial_date, final_date]
    )).rows;
    if (companyTodayRows.length) {
      panelCompanyToday = {
        nb_prem: companyTodayRows[0]?.premium ? companyTodayRows[0].premium.slice(0, -3) : '$0',
        nb_pol: companyTodayRows[0]?.policies || 0,
        rn_prem: companyTodayRows[1]?.premium ? companyTodayRows[1].premium.slice(0, -3) : '$0',
        rn_pol: companyTodayRows[1]?.policies || 0,
        rw_prem: companyTodayRows[2]?.premium ? companyTodayRows[2].premium.slice(0, -3) : '$0',
        rw_pol: companyTodayRows[2]?.policies || 0,
        tot_prem: companyTodayRows[3]?.premium ? companyTodayRows[3].premium.slice(0, -3) : '$0',
        tot_pol: companyTodayRows[3]?.policies || 0,
      };
    }
    if (companyMonthRows.length) {
      panelCompanyMonth = {
        nb_prem: companyMonthRows[0]?.premium ? companyMonthRows[0].premium.slice(0, -3) : '$0.00',
        nb_pol: companyMonthRows[0]?.policies || 0,
        rn_prem: companyMonthRows[1]?.premium ? companyMonthRows[1].premium.slice(0, -3) : '$0.00',
        rn_pol: companyMonthRows[1]?.policies || 0,
        rw_prem: companyMonthRows[2]?.premium ? companyMonthRows[2].premium.slice(0, -3) : '$0.00',
        rw_pol: companyMonthRows[2]?.policies || 0,
        tot_prem: companyMonthRows[3]?.premium ? companyMonthRows[3].premium.slice(0, -3) : '$0.00',
        tot_pol: companyMonthRows[3]?.policies || 0,
      };
    }

    // --- CSR RANKING: TOP 3 CSR  ---
    const { rows: csrRanking } = await pool.query(`
      SELECT csr, policies, premium, id_user, location
      FROM intranet.agency_csr_last_week
      ORDER BY premium DESC
      LIMIT 3
    `);
    // Para cada CSR, consulta el Top 5 de carriers de esa semana
    const carrierProms = csrRanking.map(csr =>
      pool.query(
        `SELECT id_company, carrier, policies, premium 
         FROM intranet.agency_carriers_last_week_franchise($1)`,
        [csr.id_user]
      ).then(result => result.rows)
    );
    const carriersByCsr = await Promise.all(carrierProms);
    const csrRankingWithCarriers = csrRanking.map((csr, idx) => ({
      ...csr,
      carriers: carriersByCsr[idx] || []
    }));

    // --- TOTAL DAILY (de la compañía) ---
    const { rows: totalDaily } = await pool.query(`
      SELECT premium, policies 
      FROM intranet.agency_company_today
      WHERE business_type = 'Total'
    `);
    const totalDailyData = totalDaily.length > 0 ? totalDaily[0] : { premium: "0", policies: "0" };

    // --- AGENT RANKING (ranking de agencias) ---
    const { rows: agencyRanking } = await pool.query(`
      SELECT id_location, location, policies, premium, percent
      FROM intranet.agency_dashboard_agencies
      ORDER BY premium DESC
      LIMIT 50
    `);

    // --- TOTAL MONTHLY (ventas totales de la compañía del mes) ---
    const { rows: totalMonthlyRows } = await pool.query(`
      SELECT premium, policies FROM intranet.nbtv_total_sales_month
    `);
    const totalMonthlyData = totalMonthlyRows.length > 0 ? totalMonthlyRows[0] : { premium: "$0.00", policies: 0 };

    // --- TOTAL CARRIERS (ventas totales de la compañía del mes) ---
    const { rows: carrierRanking } = await pool.query(`
      SELECT carrier_name, policies, premium, percent_premium_growth, percent_policies_growth
      FROM intranet.carrier_dashboard_sales
      ORDER BY premium DESC
    `);

    res.render('agency', {
      panelToday,
      panelMonth,
      panelCompanyToday,
      panelCompanyMonth,
      location_type,
      agency_name,
      csrRanking: csrRankingWithCarriers,
      agencyRanking,
      totalDaily: totalDailyData,
      totalMonthly: totalMonthlyData,
      carrierRanking,
    });
  } catch (err) {
    console.error('Error en agencyDashboard:', err);
    res.status(500).send("Error en el servidor");
  }
};