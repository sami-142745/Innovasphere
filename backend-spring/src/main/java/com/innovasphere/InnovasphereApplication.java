package com.innovasphere;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.innovasphere")
public class InnovasphereApplication {

    public static void main(String[] args) {
        SpringApplication.run(InnovasphereApplication.class, args);
    }
}