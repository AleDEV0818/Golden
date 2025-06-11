import { pool } from "../config/dbConfig.js";

export const agency = async (req, res) => {
  try {
    let data = {}, production, agencyMonth;
    const date = new Date();
    const initial_date = new Date(date.getFullYear(), date.getMonth(), 1);
    const final_date = new Date(date.getFullYear(), date.getMonth() + 1, 0);

    // OBTENEMOS EL USUARIO COMPLETO
    const userId = req.user.user_id || req.user.id;
    const userQuery = `
      SELECT u.user_id, u.display_name, u.job_title, u.location_id, l.location_type, l.alias, lt.location_type as location_type_name
      FROM entra.users u
      JOIN qq.locations l ON u.location_id = l.location_id
      JOIN admin.location_types lt ON l.location_type = lt.location_type_id
      WHERE u.user_id = $1
    `;
    const { rows: userRows } = await pool.query(userQuery, [userId]);
    if (!userRows.length) return res.status(404).send("Usuario no encontrado");

    const user = userRows[0];

    // Si NO es corporativo, calcula agency_today y agency_month
    if (user.location_type !== 1) {
      // --- PRODUCCIÓN DIARIA DE LA AGENCIA ---
      production = (await pool.query(
        `SELECT * FROM intranet.dashboard_location_daily($1)`, [user.location_id]
      )).rows;
      data.agency_today = {
        nb_prem: production[0]?.premium ? production[0].premium.substring(0, production[0].premium.length - 3) : '$0',
        nb_pol: production[0]?.policies || 0,
        rn_prem: production[1]?.premium ? production[1].premium.substring(0, production[1].premium.length - 3) : '$0',
        rn_pol: production[1]?.policies || 0,
        rw_prem: production[2]?.premium ? production[2].premium.substring(0, production[2].premium.length - 3) : '$0',
        rw_pol: production[2]?.policies || 0,
        tot_prem: production[3]?.premium ? production[3].premium.substring(0, production[3].premium.length - 3) : '$0',
        tot_pol: production[3]?.policies || 0,
      };
      // --- PRODUCCIÓN MENSUAL DE LA AGENCIA ---
      agencyMonth = (await pool.query(
        `SELECT * FROM intranet.dashboard_location_month($1, $2, $3)`,
        [initial_date, final_date, user.location_id]
      )).rows;
      data.agency_month = {
        nb_prem: agencyMonth[0]?.premium ? agencyMonth[0].premium.substring(0, agencyMonth[0].premium.length - 3) : '$0.00',
        nb_pol: agencyMonth[0]?.policies || 0,
        rn_prem: agencyMonth[1]?.premium ? agencyMonth[1].premium.substring(0, agencyMonth[1].premium.length - 3) : '$0.00',
        rn_pol: agencyMonth[1]?.policies || 0,
        rw_prem: agencyMonth[2]?.premium ? agencyMonth[2].premium.substring(0, agencyMonth[2].premium.length - 3) : '$0.00',
        rw_pol: agencyMonth[2]?.policies || 0,
        tot_prem: agencyMonth[3]?.premium ? agencyMonth[3].premium.substring(0, agencyMonth[3].premium.length - 3) : '$0.00',
        tot_pol: agencyMonth[3]?.policies || 0,
      };
      data.agency_alias = user.alias;
    } else {
      data.agency_today = null;
      data.agency_month = null;
      data.agency_alias = null;
    }

    // --- BLOQUE CORPORATE (location_type = 1, usando las VIEWS corporativas) ---
    let corporateTodayRows = [], corporateMonthRows = [];
    if (user.location_type === 1) {
      corporateTodayRows = (await pool.query('SELECT * FROM intranet.corporate_today')).rows;
      corporateMonthRows = (await pool.query('SELECT * FROM intranet.corporate_month')).rows;

      data.corporate_today = {
        nb_prem: corporateTodayRows[0]?.premium ? corporateTodayRows[0].premium.toString() : '$0',
        nb_pol: corporateTodayRows[0]?.policies || 0,
        rn_prem: corporateTodayRows[1]?.premium ? corporateTodayRows[1].premium.toString() : '$0',
        rn_pol: corporateTodayRows[1]?.policies || 0,
        rw_prem: corporateTodayRows[2]?.premium ? corporateTodayRows[2].premium.toString() : '$0',
        rw_pol: corporateTodayRows[2]?.policies || 0,
        tot_prem: corporateTodayRows[3]?.premium ? corporateTodayRows[3].premium.toString() : '$0',
        tot_pol: corporateTodayRows[3]?.policies || 0,
      };
      data.corporate_month = {
        nb_prem: corporateMonthRows[0]?.premium ? corporateMonthRows[0].premium.toString() : '$0.00',
        nb_pol: corporateMonthRows[0]?.policies || 0,
        rn_prem: corporateMonthRows[1]?.premium ? corporateMonthRows[1].premium.toString() : '$0.00',
        rn_pol: corporateMonthRows[1]?.policies || 0,
        rw_prem: corporateMonthRows[2]?.premium ? corporateMonthRows[2].premium.toString() : '$0.00',
        rw_pol: corporateMonthRows[2]?.policies || 0,
        tot_prem: corporateMonthRows[3]?.premium ? corporateMonthRows[3].premium.toString() : '$0.00',
        tot_pol: corporateMonthRows[3]?.policies || 0,
      };
    } else {
      data.corporate_today = null;
      data.corporate_month = null;
    }

    // --- PRODUCCIÓN DE LA COMPAÑÍA (COMPANY: location_type IN (1,2,4)), si sigues usando esta parte ---
    let companyTodayRows = (await pool.query(`SELECT * FROM intranet.dashboard_company_today`)).rows;
    let companyMonthRows = (await pool.query(
      `SELECT * FROM intranet.agency_location_corp_month($1, $2)`,
      [initial_date, final_date]
    )).rows;

    data.company_today = {
      nb_prem: companyTodayRows[0]?.premium ? companyTodayRows[0].premium.substring(0, companyTodayRows[0].premium.length - 3) : '$0',
      nb_pol: companyTodayRows[0]?.policies || 0,
      rn_prem: companyTodayRows[1]?.premium ? companyTodayRows[1].premium.substring(0, companyTodayRows[1].premium.length - 3) : '$0',
      rn_pol: companyTodayRows[1]?.policies || 0,
      rw_prem: companyTodayRows[2]?.premium ? companyTodayRows[2].premium.substring(0, companyTodayRows[2].premium.length - 3) : '$0',
      rw_pol: companyTodayRows[2]?.policies || 0,
      tot_prem: companyTodayRows[3]?.premium ? companyTodayRows[3].premium.substring(0, companyTodayRows[3].premium.length - 3) : '$0',
      tot_pol: companyTodayRows[3]?.policies || 0,
    };

    data.company_month = {
      nb_prem: companyMonthRows[0]?.premium ? companyMonthRows[0].premium.substring(0, companyMonthRows[0].premium.length - 3) : '$0.00',
      nb_pol: companyMonthRows[0]?.policies || 0,
      rn_prem: companyMonthRows[1]?.premium ? companyMonthRows[1].premium.substring(0, companyMonthRows[1].premium.length - 3) : '$0.00',
      rn_pol: companyMonthRows[1]?.policies || 0,
      rw_prem: companyMonthRows[2]?.premium ? companyMonthRows[2].premium.substring(0, companyMonthRows[2].premium.length - 3) : '$0.00',
      rw_pol: companyMonthRows[2]?.policies || 0,
      tot_prem: companyMonthRows[3]?.premium ? companyMonthRows[3].premium.substring(0, companyMonthRows[3].premium.length - 3) : '$0.00',
      tot_pol: companyMonthRows[3]?.policies || 0,
    };

    res.render('agency', {
      location_type: user.location_type,
      location_type_name: user.location_type_name,
      agency_alias: data.agency_alias,
      agency_today: data.agency_today,
      agency_month: data.agency_month,
      company_today: data.company_today,
      company_month: data.company_month,
      corporate_today: data.corporate_today,
      corporate_month: data.corporate_month
    });

  } catch (err) {
    console.error('Error en agency:', err);
    res.status(500).send("Error en el servidor");
  }
};