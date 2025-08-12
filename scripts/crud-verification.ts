#!/usr/bin/env node

/**
 * CRUD Operations Security & Safety Verification Tool
 * 
 * This script audits all CRUD operations in the application to ensure:
 * 1. Proper authentication and authorization
 * 2. Confirmation dialogs for destructive actions
 * 3. Cascade protection for parent entities
 * 4. Audit logging for all operations
 * 5. Consistent error handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface CRUDEndpoint {
  file: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  hasAuth: boolean;
  hasAudit: boolean;
  hasCascadeCheck: boolean;
  isSoftDelete: boolean;
  errors: string[];
}

interface UIComponent {
  file: string;
  component: string;
  hasConfirmDialog: boolean;
  hasWarningText: boolean;
  hasDestructiveStyle: boolean;
  errors: string[];
}

interface VerificationReport {
  endpoints: CRUDEndpoint[];
  uiComponents: UIComponent[];
  summary: {
    totalEndpoints: number;
    secureEndpoints: number;
    insecureEndpoints: number;
    totalDeleteButtons: number;
    safeDeleteButtons: number;
    unsafeDeleteButtons: number;
  };
  criticalIssues: string[];
  recommendations: string[];
}

class CRUDVerifier {
  private report: VerificationReport = {
    endpoints: [],
    uiComponents: [],
    summary: {
      totalEndpoints: 0,
      secureEndpoints: 0,
      insecureEndpoints: 0,
      totalDeleteButtons: 0,
      safeDeleteButtons: 0,
      unsafeDeleteButtons: 0,
    },
    criticalIssues: [],
    recommendations: [],
  };

  async verify(): Promise<VerificationReport> {
    console.log('🔍 Starting CRUD Operations Verification...\n');
    
    await this.verifyAPIEndpoints();
    await this.verifyUIComponents();
    this.generateSummary();
    this.identifyCriticalIssues();
    this.generateRecommendations();
    
    return this.report;
  }

  private async verifyAPIEndpoints() {
    console.log('📡 Verifying API Endpoints...');
    
    const apiFiles = await glob('app/api/**/route.ts');
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const methods = this.extractMethods(content);
      
      for (const method of methods) {
        const endpoint: CRUDEndpoint = {
          file,
          method,
          path: this.extractPath(file),
          hasAuth: this.checkAuthentication(content, method),
          hasAudit: this.checkAuditLogging(content, method),
          hasCascadeCheck: this.checkCascadeProtection(content, method),
          isSoftDelete: this.checkSoftDelete(content, method),
          errors: [],
        };
        
        // Check for security issues
        if (method === 'DELETE' && !endpoint.hasAuth) {
          endpoint.errors.push('❌ NO AUTHENTICATION - Critical security vulnerability!');
        }
        
        if (method === 'DELETE' && !endpoint.hasAudit) {
          endpoint.errors.push('⚠️ No audit logging for delete operation');
        }
        
        if (method === 'DELETE' && !endpoint.hasCascadeCheck && !endpoint.isSoftDelete) {
          endpoint.errors.push('⚠️ No cascade protection check');
        }
        
        this.report.endpoints.push(endpoint);
      }
    }
    
    console.log(`  ✓ Analyzed ${this.report.endpoints.length} endpoints\n`);
  }

  private async verifyUIComponents() {
    console.log('🎨 Verifying UI Components...');
    
    const uiFiles = await glob('app/**/*.tsx');
    const componentFiles = await glob('components/**/*.tsx');
    const allFiles = [...uiFiles, ...componentFiles];
    
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (this.hasDeleteOperation(content)) {
        const component: UIComponent = {
          file,
          component: path.basename(file, '.tsx'),
          hasConfirmDialog: this.checkConfirmationDialog(content),
          hasWarningText: this.checkWarningText(content),
          hasDestructiveStyle: this.checkDestructiveStyle(content),
          errors: [],
        };
        
        if (!component.hasConfirmDialog) {
          component.errors.push('❌ No confirmation dialog for delete operation');
        }
        
        if (!component.hasWarningText) {
          component.errors.push('⚠️ No "cannot be undone" warning');
        }
        
        if (!component.hasDestructiveStyle) {
          component.errors.push('⚠️ No destructive visual styling');
        }
        
        this.report.uiComponents.push(component);
      }
    }
    
    console.log(`  ✓ Analyzed ${this.report.uiComponents.length} components with delete operations\n`);
  }

  private extractMethods(content: string): Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> {
    const methods: Array<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'> = [];
    const methodRegex = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/g;
    let match;
    
    while ((match = methodRegex.exec(content)) !== null) {
      methods.push(match[1] as any);
    }
    
    return methods;
  }

  private extractPath(filePath: string): string {
    // Convert file path to API path
    const apiPath = filePath
      .replace('app/api', '')
      .replace('/route.ts', '')
      .replace(/\[([^\]]+)\]/g, ':$1');
    
    return `/api${apiPath}`;
  }

  private checkAuthentication(content: string, method: string): boolean {
    const methodBlock = this.extractMethodBlock(content, method);
    return methodBlock.includes('requireAuth') || 
           methodBlock.includes('requireLabAdmin') ||
           methodBlock.includes('requireResourceOwner');
  }

  private checkAuditLogging(content: string, method: string): boolean {
    const methodBlock = this.extractMethodBlock(content, method);
    return methodBlock.includes('auditDelete') || 
           methodBlock.includes('auditCreate') ||
           methodBlock.includes('auditUpdate') ||
           methodBlock.includes('createAuditLog');
  }

  private checkCascadeProtection(content: string, method: string): boolean {
    if (method !== 'DELETE') return true;
    
    const methodBlock = this.extractMethodBlock(content, method);
    return methodBlock.includes('_count') || 
           methodBlock.includes('.length > 0') ||
           methodBlock.includes('dependentData');
  }

  private checkSoftDelete(content: string, method: string): boolean {
    if (method !== 'DELETE') return false;
    
    const methodBlock = this.extractMethodBlock(content, method);
    return methodBlock.includes('isActive: false') || 
           methodBlock.includes('deletedAt: new Date()') ||
           methodBlock.includes('soft delete');
  }

  private extractMethodBlock(content: string, method: string): string {
    const regex = new RegExp(`export\\s+async\\s+function\\s+${method}[^{]*{([^}]+(?:{[^}]*}[^}]*)*)}`);
    const match = content.match(regex);
    return match ? match[0] : '';
  }

  private hasDeleteOperation(content: string): boolean {
    return content.includes('delete') || 
           content.includes('Delete') ||
           content.includes('remove') ||
           content.includes('Remove') ||
           content.includes('Trash');
  }

  private checkConfirmationDialog(content: string): boolean {
    return content.includes('ConfirmationDialog') || 
           content.includes('DeleteConfirmationDialog') ||
           content.includes('AlertDialog') ||
           content.includes('confirm');
  }

  private checkWarningText(content: string): boolean {
    return content.includes('cannot be undone') || 
           content.includes('permanently delete') ||
           content.includes('This action is irreversible');
  }

  private checkDestructiveStyle(content: string): boolean {
    return content.includes('destructive') || 
           content.includes('text-red') ||
           content.includes('bg-red') ||
           content.includes('danger');
  }

  private generateSummary() {
    const deleteEndpoints = this.report.endpoints.filter(e => e.method === 'DELETE');
    
    this.report.summary = {
      totalEndpoints: this.report.endpoints.length,
      secureEndpoints: this.report.endpoints.filter(e => e.hasAuth && (e.method !== 'DELETE' || e.hasAudit)).length,
      insecureEndpoints: this.report.endpoints.filter(e => !e.hasAuth || (e.method === 'DELETE' && !e.hasAudit)).length,
      totalDeleteButtons: this.report.uiComponents.length,
      safeDeleteButtons: this.report.uiComponents.filter(c => c.hasConfirmDialog && c.hasWarningText).length,
      unsafeDeleteButtons: this.report.uiComponents.filter(c => !c.hasConfirmDialog || !c.hasWarningText).length,
    };
  }

  private identifyCriticalIssues() {
    // Check for unauthenticated DELETE endpoints
    const unauthDeletes = this.report.endpoints.filter(
      e => e.method === 'DELETE' && !e.hasAuth
    );
    
    if (unauthDeletes.length > 0) {
      this.report.criticalIssues.push(
        `🚨 CRITICAL: ${unauthDeletes.length} DELETE endpoints have NO authentication!`
      );
      unauthDeletes.forEach(e => {
        this.report.criticalIssues.push(`   - ${e.path} (${e.file})`);
      });
    }
    
    // Check for unprotected cascading deletes
    const unprotectedDeletes = this.report.endpoints.filter(
      e => e.method === 'DELETE' && !e.hasCascadeCheck && !e.isSoftDelete
    );
    
    if (unprotectedDeletes.length > 0) {
      this.report.criticalIssues.push(
        `⚠️ WARNING: ${unprotectedDeletes.length} DELETE endpoints lack cascade protection`
      );
    }
    
    // Check for UI components without confirmation
    const unsafeUI = this.report.uiComponents.filter(c => !c.hasConfirmDialog);
    
    if (unsafeUI.length > 0) {
      this.report.criticalIssues.push(
        `⚠️ WARNING: ${unsafeUI.length} UI components have delete operations without confirmation`
      );
    }
  }

  private generateRecommendations() {
    if (this.report.summary.insecureEndpoints > 0) {
      this.report.recommendations.push(
        '1. URGENT: Add authentication to all DELETE endpoints immediately'
      );
    }
    
    const endpointsWithoutAudit = this.report.endpoints.filter(
      e => e.method === 'DELETE' && !e.hasAudit
    );
    
    if (endpointsWithoutAudit.length > 0) {
      this.report.recommendations.push(
        `2. Add audit logging to ${endpointsWithoutAudit.length} DELETE endpoints`
      );
    }
    
    if (this.report.summary.unsafeDeleteButtons > 0) {
      this.report.recommendations.push(
        `3. Add confirmation dialogs to ${this.report.summary.unsafeDeleteButtons} UI components`
      );
    }
    
    this.report.recommendations.push(
      '4. Consider implementing soft deletes for recoverable entities',
      '5. Add rate limiting to prevent deletion abuse',
      '6. Implement a recovery mechanism for accidentally deleted items'
    );
  }

  printReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 CRUD OPERATIONS VERIFICATION REPORT');
    console.log('='.repeat(80) + '\n');
    
    console.log('📈 SUMMARY');
    console.log('-'.repeat(40));
    console.log(`Total API Endpoints: ${this.report.summary.totalEndpoints}`);
    console.log(`  ✅ Secure: ${this.report.summary.secureEndpoints}`);
    console.log(`  ❌ Insecure: ${this.report.summary.insecureEndpoints}`);
    console.log(`\nTotal Delete Buttons: ${this.report.summary.totalDeleteButtons}`);
    console.log(`  ✅ Safe: ${this.report.summary.safeDeleteButtons}`);
    console.log(`  ❌ Unsafe: ${this.report.summary.unsafeDeleteButtons}`);
    
    if (this.report.criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES');
      console.log('-'.repeat(40));
      this.report.criticalIssues.forEach(issue => console.log(issue));
    }
    
    console.log('\n📝 DETAILED FINDINGS');
    console.log('-'.repeat(40));
    
    // Show problematic endpoints
    const problematicEndpoints = this.report.endpoints.filter(e => e.errors.length > 0);
    if (problematicEndpoints.length > 0) {
      console.log('\nProblematic API Endpoints:');
      problematicEndpoints.forEach(e => {
        console.log(`\n  ${e.method} ${e.path}`);
        console.log(`  File: ${e.file}`);
        e.errors.forEach(error => console.log(`    ${error}`));
      });
    }
    
    // Show problematic UI components
    const problematicUI = this.report.uiComponents.filter(c => c.errors.length > 0);
    if (problematicUI.length > 0) {
      console.log('\n\nProblematic UI Components:');
      problematicUI.forEach(c => {
        console.log(`\n  ${c.component}`);
        console.log(`  File: ${c.file}`);
        c.errors.forEach(error => console.log(`    ${error}`));
      });
    }
    
    console.log('\n💡 RECOMMENDATIONS');
    console.log('-'.repeat(40));
    this.report.recommendations.forEach(rec => console.log(rec));
    
    console.log('\n' + '='.repeat(80));
    
    // Generate report file
    const reportPath = path.join(process.cwd(), 'crud-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    // Exit with error code if critical issues found
    if (this.report.summary.insecureEndpoints > 0) {
      console.log('\n❌ Verification FAILED - Critical security issues found!');
      process.exit(1);
    } else {
      console.log('\n✅ Verification PASSED - No critical security issues found.');
      process.exit(0);
    }
  }
}

// Run the verifier
const verifier = new CRUDVerifier();
verifier.verify().then(() => {
  verifier.printReport();
}).catch(error => {
  console.error('Error running verification:', error);
  process.exit(1);
});