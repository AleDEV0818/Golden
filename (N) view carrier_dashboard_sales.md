-- View: intranet.carrier_dashboard_sales

-- DROP VIEW intranet.carrier_dashboard_sales;

CREATE OR REPLACE VIEW intranet.carrier_dashboard_sales
 AS
 SELECT nbl.carrier_id AS id_carrier,
    c.display_name AS carrier_name,
    nbl.policies,
    nbl.premium,
        CASE
            WHEN nbl.lmpremium = '$0.00'::money THEN '0'::numeric
            ELSE round((nbl.premium / nbl.lmpremium * 100::double precision - 100::double precision)::numeric, 1)
        END AS percent_premium_growth,
        CASE
            WHEN nbl.lmpolicies = 0 THEN 0::numeric
            ELSE round(nbl.policies::numeric / nbl.lmpolicies::numeric * 100::numeric - 100::numeric, 1)
        END AS percent_policies_growth
   FROM ( SELECT tm.carrier_id,
            tm.policies,
            tm.premium,
            llm.lmpolicies,
            llm.lmpremium
           FROM ( SELECT p.carrier_id,
                    count(p.policy_id) AS policies,
                    sum(p.premium) AS premium
                   FROM qq.policies p
                  WHERE date_trunc('month'::text, p.binder_date::timestamp with time zone) = date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND p.premium > '$0.05'::money AND (p.policy_status::text = 'A'::text OR p.policy_status::text = 'C'::text)
                  GROUP BY p.carrier_id) tm
             LEFT JOIN ( SELECT p.carrier_id,
                    count(p.policy_id) AS lmpolicies,
                    sum(p.premium) AS lmpremium
                   FROM qq.policies p
                  WHERE date_trunc('month'::text, p.binder_date::timestamp with time zone) = (date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) - '1 mon'::interval) AND p.premium > '$0.05'::money AND (p.policy_status::text = 'A'::text OR p.policy_status::text = 'C'::text)
                  GROUP BY p.carrier_id) llm ON llm.carrier_id = tm.carrier_id) nbl
     LEFT JOIN qq.contacts c ON c.entity_id = nbl.carrier_id
  ORDER BY nbl.premium DESC;

ALTER TABLE intranet.carrier_dashboard_sales
    OWNER TO postgres;