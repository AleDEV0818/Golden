-- View: intranet.corporate_today

-- DROP VIEW intranet.corporate_today;

CREATE OR REPLACE VIEW intranet.corporate_today
 AS
 SELECT 'New Business'::text AS business_type,
    count(p.policy_id) AS policies,
    COALESCE(sum(p.premium), 0::money) AS premium
   FROM qq.policies p
     JOIN qq.contacts c ON p.customer_id = c.entity_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE p.business_type::text = 'N'::text AND (l.location_type = ANY (ARRAY[1, 4])) AND (p.policy_status::text = ANY (ARRAY['A'::text, 'E'::text, 'P'::text])) AND p.binder_date = CURRENT_DATE
UNION
 SELECT 'Renewal'::text AS business_type,
    count(p.policy_id) AS policies,
    COALESCE(sum(p.premium), 0::money) AS premium
   FROM qq.policies p
     JOIN qq.contacts c ON p.customer_id = c.entity_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE p.business_type::text = 'R'::text AND l.location_type = 1 AND (p.policy_status::text = ANY (ARRAY['A'::text, 'E'::text, 'P'::text])) AND p.binder_date = CURRENT_DATE
UNION
 SELECT 'Rewrite'::text AS business_type,
    count(p.policy_id) AS policies,
    COALESCE(sum(p.premium), 0::money) AS premium
   FROM qq.policies p
     JOIN qq.contacts c ON p.customer_id = c.entity_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE p.business_type::text = 'W'::text AND l.location_type = 1 AND (p.policy_status::text = ANY (ARRAY['A'::text, 'E'::text, 'P'::text])) AND p.binder_date = CURRENT_DATE
UNION
 SELECT 'Total'::text AS business_type,
    count(p.policy_id) AS policies,
    COALESCE(sum(p.premium), 0::money) AS premium
   FROM qq.policies p
     JOIN qq.contacts c ON p.customer_id = c.entity_id
     JOIN qq.locations l ON c.location_id = l.location_id
  WHERE (p.business_type::text = 'N'::text AND (l.location_type = ANY (ARRAY[1, 4])) OR (p.business_type::text = ANY (ARRAY['R'::text, 'W'::text])) AND l.location_type = 1) AND (p.policy_status::text = ANY (ARRAY['A'::text, 'E'::text, 'P'::text])) AND p.binder_date = CURRENT_DATE;

ALTER TABLE intranet.corporate_today
    OWNER TO postgres;

