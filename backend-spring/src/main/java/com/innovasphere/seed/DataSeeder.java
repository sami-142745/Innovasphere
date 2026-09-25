package com.innovasphere.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/** Runs the Innovasphere seeder on startup when app.seed.enabled=true (default false). */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

  private final SeedDataService seedDataService;

  @Value("${app.seed.enabled:false}")
  private boolean seedEnabled;

  @Override
  public void run(ApplicationArguments args) {
    seedDataService.seedIfNeeded(seedEnabled);
  }
}