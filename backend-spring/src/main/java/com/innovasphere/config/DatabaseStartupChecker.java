package com.innovasphere.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DatabaseStartupChecker implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseStartupChecker.class);

    private final JdbcTemplate jdbcTemplate;
    private final String databaseName;

    public DatabaseStartupChecker(JdbcTemplate jdbcTemplate, @Value("${DB_NAME:innovasphere}") String databaseName) {
        this.jdbcTemplate = jdbcTemplate;
        this.databaseName = databaseName;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            Integer ping = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            if (ping != null && ping == 1) {
                log.info("Successfully connected to MySQL database: {}", databaseName);
            } else {
                log.error("MySQL availability check returned an unexpected result: {}", ping);
            }
        } catch (Exception ex) {
            log.error("Failed to connect to MySQL database: {}. Error: {}", databaseName, ex.getMessage());
        }
    }
}