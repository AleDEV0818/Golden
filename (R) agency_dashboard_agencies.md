SELECT l.location_id AS id_location,
    nbl.location,
    nbl.policies,
    nbl.premium,
        CASE
            WHEN nbl.lmpremium = '$0.00'::money THEN '0'::numeric
            ELSE round((nbl.premium / nbl.lmpremium * 100::double precision)::numeric, 1) - 100::numeric
        END AS percent
   FROM ( SELECT tm.location,
            tm.policies,
            tm.premium,
            llm.lmpolicies,
            llm.lmpremium
           FROM ( SELECT l_1.alias AS location,
                    count(qq_policies.binder_date) AS policies,
                    sum(qq_policies.premium) AS premium
                   FROM qq.policies qq_policies
                     JOIN qq.contacts c ON c.entity_id = qq_policies.customer_id
                     JOIN qq.locations l_1 ON c.location_id = l_1.location_id
                  WHERE qq_policies.business_type::text = 'N'::text AND date_trunc('month'::text, qq_policies.binder_date::timestamp with time zone) = date_trunc('month'::text, CURRENT_DATE::timestamp with time zone) AND qq_policies.premium > '$0.05'::money AND (qq_policies.policy_status::text = 'A'::text OR qq_policies.policy_status::text = 'C'::text)
                  GROUP BY l_1.alias) tm
             LEFT JOIN ( SELECT l_1.alias AS location,
                    count(qq_policies.binder_date) AS lmpolicies,
                    sum(qq_policies.premium) AS lmpremium
                   FROM qq.policies qq_policies
                     JOIN qq.contacts c ON c.entity_id = qq_policies.customer_id
                     JOIN qq.locations l_1 ON c.location_id = l_1.location_id
                  WHERE qq_policies.business_type::text = 'N'::text AND qq_policies.binder_date >= (date_trunc('month'::text, now()) - '1 mon'::interval month) AND qq_policies.binder_date <= (CURRENT_DATE - '1 mon'::interval) AND qq_policies.premium > '$0.05'::money AND (qq_policies.policy_status::text = 'A'::text OR qq_policies.policy_status::text = 'C'::text)
                  GROUP BY l_1.alias) llm ON llm.location::text = tm.location::text) nbl
     LEFT JOIN qq.locations l ON initcap(TRIM(BOTH FROM l.alias::text)) = initcap(TRIM(BOTH FROM nbl.location::text))
  ORDER BY nbl.premium DESC;